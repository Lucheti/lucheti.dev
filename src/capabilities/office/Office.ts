import type { IdeaQueue } from "./IdeaQueue";
import type { QaVerdicts } from "./QaVerdicts";
import type { RoutePlanner } from "./RoutePlanner";
import { headingOf, type TicketRoute } from "./TicketRoute";
import type { OfficeEvent, OfficeSnapshot, TicketAt, TicketName, TicketWhere } from "./types";

/** How the floor runs. */
export type OfficeRules = Readonly<{
  /** Tickets on the floor at once, at most. */
  inFlight: number;
  /** Seconds the floor stays empty before a ticket sets off by itself. */
  pause: number;
  /** Seconds kept clear between two tickets at every station. */
  margin: number;
}>;

/** A ticket on its way: which it is, its route, when it set off, the last step seen, and whether it has lifted off. */
type Flight = {
  readonly serial: number;
  readonly name: TicketName;
  readonly route: TicketRoute;
  readonly start: number;
  index: number;
  shipped: boolean;
};

type Listener = () => void;
type EventListener = (events: readonly OfficeEvent[]) => void;

/**
 * The Orchestra office floor, driven by the seconds handed to it: ideas the visitor drops wait in Product's
 * inbox and set off one after another, at most a couple at once, each kept clear of the one ahead at every
 * station. When the floor has been empty a moment, a ticket sets off by itself, so the office never stands
 * still. It tells its listeners when a ticket is sent back by QA or ships, and keeps a snapshot for the
 * strip under the island that changes only when one of its words does.
 */
export class Office {
  private now = 0;
  private serial = 0;
  private idleFor: number;
  private shippedCount = 0;
  private revision = 0;
  private readonly flights: Flight[] = [];
  private upcoming: TicketRoute | null = null;
  private current: OfficeSnapshot;
  private readonly listeners = new Set<Listener>();
  private readonly eventListeners = new Set<EventListener>();

  public constructor(
    private readonly planner: RoutePlanner,
    private readonly verdicts: QaVerdicts,
    private readonly inbox: IdeaQueue,
    private readonly names: readonly TicketName[],
    private readonly rules: OfficeRules,
  ) {
    if (names.length === 0) {
      throw new Error("The office needs at least one ticket name");
    }
    if (!Number.isInteger(rules.inFlight) || rules.inFlight < 1 || !(rules.pause >= 0) || !(rules.margin >= 0)) {
      throw new Error("The office needs room for a ticket, and a pause and a margin that are not negative");
    }
    // The first ticket sets off at once.
    this.idleFor = rules.pause;
    this.current = this.snapshot();
  }

  /** The latest snapshot for the strip. */
  public readonly view = (): OfficeSnapshot => this.current;

  /** Calls `listener` whenever `view()` changes; returns the unsubscribe. */
  public readonly subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** Calls `listener` with each batch of events; returns the unsubscribe. */
  public listen(listener: EventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  /** The visitor drops an idea into Product's inbox; a full inbox turns it away. */
  public drop(): void {
    const event: OfficeEvent = this.inbox.drop() ? { kind: "dropped" } : { kind: "full" };
    this.tell([event]);
    this.refresh();
  }

  /** Moves the floor on by `seconds`. */
  public advance(seconds: number): void {
    this.now += Math.max(0, seconds);
    const events = this.move();
    this.idleFor = this.flights.length === 0 && this.inbox.empty() ? this.idleFor + Math.max(0, seconds) : 0;
    this.startWhatCan();
    this.tell(events);
    this.refresh();
  }

  /** Every ticket on the floor and where it is, the oldest first. */
  public tickets(): readonly TicketAt[] {
    return this.flights.map((flight) => ({ serial: flight.serial, name: flight.name, beat: flight.route.at(this.now - flight.start) }));
  }

  /** How many ideas wait in the inbox. */
  public waiting(): number {
    return this.inbox.count();
  }

  /** Moves every ticket along its route, noting the steps it passed, and takes off the floor those whose trip is over. */
  private move(): OfficeEvent[] {
    const events: OfficeEvent[] = [];
    for (const flight of this.flights) {
      const elapsed = this.now - flight.start;
      const beat = flight.route.at(elapsed);
      for (let index = flight.index + 1; index <= beat.index; index += 1) {
        const leg = flight.route.leg(index);
        if (leg.kind === "verdict" && !leg.pass) {
          events.push({ kind: "bounced", name: flight.name });
        } else if (leg.kind === "launch") {
          flight.shipped = true;
          this.shippedCount += 1;
          events.push({ kind: "shipped", name: flight.name });
        }
      }
      flight.index = beat.index;
    }
    for (let index = this.flights.length - 1; index >= 0; index -= 1) {
      const flight = this.flights[index];
      if (flight.route.over(this.now - flight.start)) {
        this.flights.splice(index, 1);
      }
    }
    return events;
  }

  /** Sets off waiting ideas, or a ticket of its own on an empty floor, while there is room and the way is clear. */
  private startWhatCan(): void {
    while (this.flights.length < this.rules.inFlight) {
      const fromInbox = !this.inbox.empty();
      const byItself = !fromInbox && this.flights.length === 0 && this.idleFor >= this.rules.pause;
      if (!fromInbox && !byItself) {
        return;
      }
      const route = this.upcoming ?? this.planner.plan(this.verdicts.bounces());
      this.upcoming = route;
      const clear = this.flights.reduce((earliest, flight) => Math.max(earliest, flight.route.earliestFollower(flight.start, route, this.rules.margin)), this.now);
      if (clear > this.now) {
        return;
      }
      if (fromInbox) {
        this.inbox.take();
      }
      const serial = this.serial;
      this.serial += 1;
      this.flights.push({ serial, name: this.names[serial % this.names.length], route, start: this.now, index: 0, shipped: false });
      this.upcoming = null;
      this.idleFor = 0;
    }
  }

  private tell(events: readonly OfficeEvent[]): void {
    if (events.length > 0) {
      this.eventListeners.forEach((listener) => listener(events));
    }
  }

  /** Swaps in a new snapshot, and tells the subscribers, only when a word in the strip changed. */
  private refresh(): void {
    const next = this.snapshot();
    const before = this.current;
    if (
      next.waiting === before.waiting &&
      next.shipped === before.shipped &&
      next.current?.serial === before.current?.serial &&
      next.current?.station === before.current?.station
    ) {
      return;
    }
    this.revision += 1;
    this.current = { ...next, revision: this.revision };
    this.listeners.forEach((listener) => listener());
  }

  private snapshot(): OfficeSnapshot {
    return { revision: this.revision, waiting: this.inbox.count(), shipped: this.shippedCount, current: this.followed() };
  }

  /** The oldest ticket that has not lifted off yet; failing that, the latest one lifting off. */
  private followed(): TicketWhere | null {
    const flight = this.flights.find((candidate) => !candidate.shipped) ?? this.flights.at(-1);
    if (flight === undefined) {
      return null;
    }
    return { serial: flight.serial, name: flight.name, station: headingOf(flight.route.at(this.now - flight.start).leg) };
  }
}
