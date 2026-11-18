import type { Edge } from "./topology";

/**
 * What a dot on an edge is: an ordinary request, a request the gateway retries, one of the gateway's test
 * requests to a half-open service, or a message a service drains from the queue (it travels back along the
 * service's edge to NATS).
 */
export type FlightKind = "request" | "retry" | "probe" | "drain";

/** What the painter reads of a dot in the air. */
export interface FlightView {
  /** Whether this slot holds a dot now. */
  flying(): boolean;
  edge(): Edge | null;
  kind(): FlightKind;
  /** Whether it travels the edge from its end back to its start. */
  backwards(): boolean;
  /** How far along, from 0 at its start to 1 on arrival. */
  progress(): number;
}

/** One reusable dot. */
class FlightSlot implements FlightView {
  private route: Edge | null = null;
  private what: FlightKind = "request";
  private reverse = false;
  private elapsed = 0;
  private length = 1;
  private tries = 0;
  private born = 0;

  public flying(): boolean {
    return this.route !== null;
  }

  public edge(): Edge | null {
    return this.route;
  }

  public kind(): FlightKind {
    return this.what;
  }

  public backwards(): boolean {
    return this.reverse;
  }

  public progress(): number {
    return Math.min(1, this.elapsed / this.length);
  }

  /** Which attempt at its request this is, from 1. */
  public attempt(): number {
    return this.tries;
  }

  /** Puts it on an edge during step `tick` of the pool. */
  public launch(edge: Edge, kind: FlightKind, durationMs: number, attempt: number, backwards: boolean, tick: number): void {
    this.route = edge;
    this.what = kind;
    this.reverse = backwards;
    this.elapsed = 0;
    this.length = durationMs;
    this.tries = attempt;
    this.born = tick;
  }

  /** Moves it on by `ms` in step `tick`; a dot launched during that step waits for the next. Says whether it arrived. */
  public advance(ms: number, tick: number): boolean {
    if (this.route === null || this.born === tick) {
      return false;
    }
    this.elapsed += ms;
    return this.elapsed >= this.length;
  }

  public land(): void {
    this.route = null;
  }
}

/** A dot that has just arrived, read before its slot is freed. */
export type Arrival = Readonly<{ edge: Edge; kind: FlightKind; attempt: number; backwards: boolean }>;

/**
 * A fixed pool of dots, so the map never draws more than it can read and never allocates per frame.
 * Ordinary requests leave `reserve` slots free, so retries and test requests, which the breakers count on,
 * always fly.
 */
export class FlightPool {
  private readonly slots: readonly FlightSlot[];
  private tick = 0;

  public constructor(
    size: number,
    private readonly reserve: number,
  ) {
    if (!Number.isInteger(size) || !Number.isInteger(reserve) || reserve < 0 || size <= reserve) {
      throw new Error(`A pool needs more slots than it keeps in reserve: ${size}, ${reserve}`);
    }
    this.slots = Array.from({ length: size }, () => new FlightSlot());
  }

  /** Every slot, flying or not, in a fixed order: slot i is always drawn by dot i. */
  public views(): readonly FlightView[] {
    return this.slots;
  }

  /** How many dots are in the air. */
  public flying(): number {
    return this.slots.reduce((count, slot) => count + (slot.flying() ? 1 : 0), 0);
  }

  /**
   * Launches a dot; ordinary requests and drained messages only while the reserve is free. Says whether it
   * flew.
   */
  public launch(edge: Edge, kind: FlightKind, durationMs: number, attempt = 1, backwards = false): boolean {
    const essential = kind === "retry" || kind === "probe";
    if (!essential && this.flying() >= this.slots.length - this.reserve) {
      return false;
    }
    const free = this.slots.find((slot) => !slot.flying());
    if (free === undefined) {
      return false;
    }
    free.launch(edge, kind, durationMs, attempt, backwards, this.tick);
    return true;
  }

  /**
   * Moves every dot on by `ms` and hands each one that arrived to `onArrival`, after freeing its slot. Dots
   * launched from `onArrival` start moving on the next step.
   */
  public advance(ms: number, onArrival: (arrival: Arrival) => void): void {
    this.tick += 1;
    for (const slot of this.slots) {
      if (slot.advance(ms, this.tick)) {
        const edge = slot.edge();
        if (edge !== null) {
          const arrival: Arrival = { edge, kind: slot.kind(), attempt: slot.attempt(), backwards: slot.backwards() };
          slot.land();
          onArrival(arrival);
        }
      }
    }
  }

  /** Clears the air. */
  public clear(): void {
    this.slots.forEach((slot) => slot.land());
  }
}
