import { assertNever } from "./assertNever";
import { Backlog } from "./Backlog";
import type { Clock } from "./Clock";
import { ConsumerService, type ServiceChange } from "./ConsumerService";
import { Flights } from "./Flights";
import { Producer } from "./Producer";
import type { RandomSource } from "./RandomSource";
import type { Anchor, QueueConfig, QueueEvent, QueueSnapshot } from "./types";

const PRODUCER: Anchor = { kind: "producer" };
const QUEUE: Anchor = { kind: "queue" };

/**
 * A producer, a queue and a few consumer services, stepped on a fixed beat up to the injected clock's
 * time. Messages fly producer → queue → the least-busy healthy service. A service kept over its limit
 * goes down and hands its messages back; after a crash the broker deals gently (never past a service's
 * limit) until the queue is clear, so recovered services drain the backlog instead of falling over again.
 * Every message is always in exactly one place: in the air, in the queue, at a service, or processed.
 */
export class QueueSimulation {
  private readonly producer: Producer;
  private readonly backlog: Backlog;
  private readonly flights = new Flights();
  private readonly services: readonly ConsumerService[];
  private readonly lastDealtAt: number[];
  private readonly events: QueueEvent[] = [];
  private time: number;
  private nextId = 0;
  private nextDealAt: number;
  private gentle = false;
  private revision = 0;

  public constructor(
    private readonly clock: Clock,
    random: RandomSource,
    private readonly config: QueueConfig,
  ) {
    if (config.services.length === 0) {
      throw new Error("A queue needs at least one service");
    }
    if (!(config.stepMs > 0)) {
      throw new Error(`The step must be positive: ${config.stepMs}`);
    }
    if (config.broker.capacity < config.rules.limit) {
      throw new Error("The broker's capacity per service cannot be below a service's limit");
    }
    this.time = clock.now();
    this.nextDealAt = this.time;
    this.producer = new Producer(config.arrival, config.burst, random, this.time);
    this.backlog = new Backlog(config.broker.dwellMs);
    this.services = config.services.map((profile) => new ConsumerService(profile, config.rules, random));
    this.lastDealtAt = config.services.map(() => Number.NEGATIVE_INFINITY);
  }

  /** Sends up to `count` more messages; returns how many were accepted (unfinished work is capped). */
  public send(count: number): number {
    const room = this.config.burst.maxOutstanding - this.outstanding() - this.producer.waiting();
    const accepted = Math.max(0, Math.min(Math.floor(count), room));
    if (accepted > 0) {
      this.producer.send(accepted, this.time);
    }
    return accepted;
  }

  /** Stops the steady flow of messages; sent messages still go out. */
  public holdSteadyFlow(): void {
    this.producer.hold();
  }

  /** Starts the steady flow again. */
  public resumeSteadyFlow(): void {
    this.producer.resume(this.time);
  }

  /** Steps the simulation up to the clock's current time. */
  public update(): void {
    const target = this.clock.now();
    while (this.time + this.config.stepMs <= target) {
      this.time += this.config.stepMs;
      this.step();
    }
  }

  /** Whether nothing is moving: no message waiting, travelling or at work, every service healthy. */
  public isSettled(): boolean {
    return (
      this.producer.waiting() === 0 &&
      this.backlog.depth() === 0 &&
      this.flights.count() === 0 &&
      this.services.every((service) => service.isIdle())
    );
  }

  /** Hands over the events since the last call. */
  public takeEvents(): readonly QueueEvent[] {
    return this.events.splice(0, this.events.length);
  }

  /** The current state, for drawing. */
  public snapshot(): QueueSnapshot {
    const services = this.services.map((service) => service.view());
    return {
      time: this.time,
      revision: this.revision,
      queued: this.backlog.ids(),
      flights: this.flights.views(this.time),
      services,
      totals: {
        produced: this.nextId,
        processed: services.reduce((sum, service) => sum + service.processed, 0),
        restarts: services.reduce((sum, service) => sum + service.restarts, 0),
      },
    };
  }

  private outstanding(): number {
    return this.nextId - this.services.reduce((sum, service) => sum + service.view().processed, 0);
  }

  private step(): void {
    this.publish();
    this.landFlights();
    this.services.forEach((service, index) => {
      service.step(this.time).forEach((change) => this.apply(change, index));
    });
    this.deal();
    this.settle();
  }

  private publish(): void {
    const leaving = this.producer.step(this.time);
    for (let count = 0; count < leaving; count += 1) {
      this.flights.launch(this.nextId, PRODUCER, QUEUE, this.time, this.config.travel.toQueue);
      this.nextId += 1;
      this.revision += 1;
    }
  }

  private landFlights(): void {
    for (const flight of this.flights.land(this.time)) {
      this.revision += 1;
      switch (flight.to.kind) {
        case "queue":
          this.backlog.push(flight.id, this.time);
          break;
        case "service":
          if (this.services[flight.to.index].receive(flight.id, this.time) === "bounced") {
            this.flights.launch(flight.id, flight.to, QUEUE, this.time, this.config.travel.back);
          }
          break;
        case "producer":
          throw new Error(`Message ${flight.id} flew back to the producer`);
        default:
          assertNever(flight.to);
      }
    }
  }

  private apply(change: ServiceChange, index: number): void {
    this.revision += 1;
    switch (change.kind) {
      case "completed":
      case "strained":
      case "relieved":
        return;
      case "down":
        this.gentle = true;
        change.returned.forEach((id) => {
          this.flights.launch(id, { kind: "service", index }, QUEUE, this.time, this.config.travel.back);
        });
        this.events.push({ kind: "down", service: index, returned: change.returned.length });
        return;
      case "restarting":
        this.events.push({ kind: "restarting", service: index });
        return;
      case "recovered":
        this.events.push({ kind: "recovered", service: index });
        return;
      default:
        assertNever(change);
    }
  }

  /** Deals the head of the queue to the least-busy service that will take it, one message per deal gap. */
  private deal(): void {
    if (this.time < this.nextDealAt || !this.backlog.hasReady(this.time)) {
      return;
    }
    const target = this.leastBusy();
    if (target === undefined) {
      return;
    }
    const id = this.backlog.take();
    this.services[target].expect();
    this.lastDealtAt[target] = this.time;
    this.flights.launch(id, QUEUE, { kind: "service", index: target }, this.time, this.config.travel.toService);
    this.nextDealAt = this.time + this.config.broker.dealGapMs;
    this.revision += 1;
  }

  /** The service with the fewest messages that still has room; ties go to the one dealt to longest ago. */
  private leastBusy(): number | undefined {
    const cap = this.gentle ? this.config.rules.limit : this.config.broker.capacity;
    let best: number | undefined;
    this.services.forEach((service, index) => {
      if (!service.accepts(cap)) {
        return;
      }
      if (best === undefined) {
        best = index;
        return;
      }
      const load = service.load();
      const bestLoad = this.services[best].load();
      if (load < bestLoad || (load === bestLoad && this.lastDealtAt[index] < this.lastDealtAt[best])) {
        best = index;
      }
    });
    return best;
  }

  /** Lifts gentle dealing once the backlog is gone and every service is back. */
  private settle(): void {
    if (this.gentle && this.backlog.depth() === 0 && this.services.every((service) => service.isUp())) {
      this.gentle = false;
      this.events.push({ kind: "settled" });
    }
  }
}
