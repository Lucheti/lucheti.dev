import { assertNever } from "../queue/assertNever";
import type { Clock } from "../queue/Clock";
import type { RandomSource } from "../queue/RandomSource";
import type { CircuitBreaker } from "./CircuitBreaker";
import type { Emitter } from "./Emitter";
import type { Arrival, FlightPool, FlightView } from "./FlightPool";
import type { MapConfig } from "./mapConfig";
import type { ServiceBag } from "./ServiceBag";
import type { ServiceHealth } from "./ServiceHealth";
import { queueConsumers, SERVICES, STORE_LINKS, type EdgeBook, type ServiceId } from "./topology";
import type { ServiceGate, TrafficModel } from "./TrafficModel";
import type { MapEvent, MapSnapshot, NodeMetric, ServiceView } from "./types";

/** Everything the simulation runs on; the composition root builds it. */
export type MapParts = Readonly<{
  config: MapConfig;
  clock: Clock;
  random: RandomSource;
  edges: EdgeBook;
  health: Readonly<Record<ServiceId, ServiceHealth>>;
  breakers: Readonly<Record<ServiceId, CircuitBreaker>>;
  traffic: TrafficModel;
  pool: FlightPool;
  bag: ServiceBag;
  requests: Emitter;
  drains: Emitter;
}>;

/** How much a card's live figures wobble from one refresh to the next, as a share. */
const WOBBLE = 0.04;
/** What a frame with nothing to say hands back, so quiet frames build nothing. */
const NO_EVENTS: readonly MapEvent[] = Object.freeze([]);

/**
 * The live service map, deterministic for a seed and driven by an injected clock. Requests leave the clients
 * as dots, pass the gateway to a service and go on to one of its stores. A downed service fails the requests
 * that reach it; the gateway retries each a few times, and enough failures in a row open its circuit breaker
 * for that service, after which requests to it fail fast at the gateway. Open for a while, the breaker goes
 * half-open and sends test requests; once enough pass (the service has restarted) it closes and the service
 * is back. A spike multiplies the traffic for a while: the queue fills faster than its consumers drain it
 * and p95 rises, then both settle.
 */
export class ServiceMapSimulation implements ServiceGate {
  private last: number;
  private revision = 0;
  private sinceMetrics = 0;
  private wobble = 1;
  private awaitingCalm = false;
  private readonly untilProbe: Record<ServiceId, number> = { orders: 0, payments: 0, inventory: 0 };
  private events: MapEvent[] = [];
  private current: MapSnapshot;

  public constructor(private readonly parts: MapParts) {
    this.last = parts.clock.now();
    this.current = this.build();
  }

  /** The visitor (or the ghost) takes a service down. Says whether it went down; a service already out cannot. */
  public takeDown(service: ServiceId): boolean {
    const quiet = this.incidents() === 0 && SERVICES.every((other) => this.parts.breakers[other].admits());
    if (!this.parts.health[service].takeDown(this.parts.clock.now())) {
      return false;
    }
    if (quiet) {
      this.parts.traffic.clearFailures();
    }
    this.events.push({ kind: "down", service });
    this.publish();
    return true;
  }

  /** The visitor (or the ghost) starts a spike. Says whether it started; one runs at a time. */
  public spike(): boolean {
    if (!this.parts.traffic.startSpike(this.parts.clock.now())) {
      return false;
    }
    this.awaitingCalm = true;
    this.events.push({ kind: "spike" });
    this.publish();
    return true;
  }

  /** Brings the map up to the clock's time. */
  public update(): void {
    const now = this.parts.clock.now();
    const ms = Math.max(0, now - this.last);
    this.last = now;
    let changed = this.heal(now);
    this.parts.traffic.advance(now, ms, this);
    this.emit(now, ms);
    this.parts.pool.advance(ms, this.arrive);
    if (this.awaitingCalm && this.parts.traffic.settled(now)) {
      this.awaitingCalm = false;
      this.events.push({ kind: "settled" });
      changed = true;
    }
    this.sinceMetrics += ms;
    if (this.sinceMetrics >= this.parts.config.metricEveryMs) {
      this.sinceMetrics %= this.parts.config.metricEveryMs;
      this.wobble = 1 + WOBBLE * (2 * this.parts.random.next() - 1);
      changed = true;
    }
    if (changed || this.events.length > 0) {
      this.publish();
    }
  }

  /** The map as React draws it. */
  public readonly snapshot = (): MapSnapshot => this.current;

  /** Every dot slot, flying or not, in a fixed order. */
  public flights(): readonly FlightView[] {
    return this.parts.pool.views();
  }

  /** The events since the last call, oldest first. */
  public takeEvents(): readonly MapEvent[] {
    if (this.events.length === 0) {
      return NO_EVENTS;
    }
    const taken = this.events;
    this.events = [];
    return taken;
  }

  public admits(service: ServiceId): boolean {
    return this.parts.breakers[service].admits();
  }

  public answers(service: ServiceId): boolean {
    return this.parts.health[service].answers();
  }

  /** Restarts, breakers going half-open, and services the gateway trusts again. Says whether anything changed. */
  private heal(now: number): boolean {
    let changed = false;
    for (const service of SERVICES) {
      const health = this.parts.health[service];
      const breaker = this.parts.breakers[service];
      changed = health.update(now) || changed;
      if (breaker.update(now) === "half-opened") {
        this.untilProbe[service] = 0;
        this.events.push({ kind: "probing", service });
        changed = true;
      }
      if (breaker.phase() === "closed" && health.recover()) {
        this.events.push({ kind: "back", service });
        changed = true;
      }
    }
    return changed;
  }

  /** New dots: requests from the clients, test requests from half-open breakers, messages drained from the queue. */
  private emit(now: number, ms: number): void {
    const { config, pool, edges, traffic } = this.parts;
    const requests = this.parts.requests.advance(ms, config.dotsPerSecond * traffic.load(now));
    for (let i = 0; i < requests; i += 1) {
      pool.launch(edges.entry(), "request", config.hops.request);
    }
    for (const service of SERVICES) {
      if (this.parts.breakers[service].probing()) {
        this.untilProbe[service] -= ms;
        if (this.untilProbe[service] <= 0) {
          this.untilProbe[service] += config.probeEveryMs;
          pool.launch(edges.route(service), "probe", config.hops.probe);
        }
      }
    }
    const drains = traffic.queued() > 0 ? this.parts.drains.advance(ms, config.queue.drainDotsPerSecond) : 0;
    if (drains > 0) {
      const consumers = queueConsumers().filter((service) => this.answers(service));
      for (let i = 0; i < drains && consumers.length > 0; i += 1) {
        const service = consumers[Math.floor(this.parts.random.next() * consumers.length)];
        pool.launch(edges.store(service, "nats"), "drain", config.hops.drain, 1, true);
      }
    }
  }

  /** A dot reached the end of its edge. */
  private readonly arrive = (arrival: Arrival): void => {
    const { edge } = arrival;
    switch (edge.kind) {
      case "entry":
        this.atGateway();
        break;
      case "route":
        this.atService(edge.service, arrival);
        break;
      case "store":
        break;
      default:
        assertNever(edge);
    }
  };

  /** A request reached the gateway: on to its service, unless that service's breaker fails it fast. */
  private atGateway(): void {
    const service = this.parts.bag.next();
    if (this.parts.breakers[service].admits()) {
      this.parts.pool.launch(this.parts.edges.route(service), "request", this.parts.config.hops.request);
    }
  }

  /** A request, retry or test request reached a service. */
  private atService(service: ServiceId, arrival: Arrival): void {
    const { config, pool, edges, random } = this.parts;
    const breaker = this.parts.breakers[service];
    const now = this.parts.clock.now();
    if (this.parts.health[service].answers()) {
      breaker.pass();
      if (arrival.kind !== "probe") {
        const stores = STORE_LINKS[service];
        pool.launch(edges.store(service, stores[Math.floor(random.next() * stores.length)]), "request", config.hops.request);
      }
      return;
    }
    if (breaker.fail(now) === "opened") {
      this.events.push({ kind: "opened", service });
      return;
    }
    if (arrival.kind !== "probe" && arrival.attempt < config.maxAttempts && breaker.admits()) {
      pool.launch(edges.route(service), "retry", config.hops.retry, arrival.attempt + 1);
    }
  }

  private incidents(): number {
    return SERVICES.filter((service) => this.parts.health[service].phase() !== "up").length;
  }

  private publish(): void {
    this.revision += 1;
    this.current = this.build();
  }

  private build(): MapSnapshot {
    const { traffic, breakers, health, config } = this.parts;
    const now = this.parts.clock.now();
    const rate = (n: number): NodeMetric => ({ kind: "rate", n: Math.round(n * this.wobble) });
    const failing = SERVICES.some((service) => !breakers[service].admits());
    const services = SERVICES.map(
      (id): ServiceView => ({
        id,
        health: health[id].phase(),
        breaker: breakers[id].phase(),
        metric: { kind: "p95", n: Math.round(traffic.p95(id) * this.wobble) },
      }),
    );
    const opsOf = (service: ServiceId, factor: number): NodeMetric => ({
      kind: "ops",
      n: Math.round(traffic.serviceRps(service, now, breakers[service].admits()) * factor * this.wobble),
    });
    return {
      revision: this.revision,
      clients: rate(traffic.rps(now)),
      gateway: { metric: failing ? { kind: "failed-fast", n: traffic.failedFast() } : rate(traffic.rps(now)), failing },
      services,
      stores: {
        postgres: opsOf("orders", config.storeOps.postgres),
        nats: { kind: "queued", n: traffic.queued() },
        redis: opsOf("inventory", config.storeOps.redis),
      },
      queueFill: traffic.queueFill(),
      spiking: traffic.spiking(now),
      incidents: this.incidents(),
    };
  }
}
