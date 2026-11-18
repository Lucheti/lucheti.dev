import { assertNever } from "./assertNever";
import type { Beat, Leg, LegKind, StationId } from "./types";

/** How many seconds each kind of step takes. */
export type LegTiming = Readonly<Record<LegKind, number>>;

/** The station a step is at, or heading for when it is a trip between two. */
export function headingOf(leg: Leg): StationId {
  switch (leg.kind) {
    case "stamp":
      return "product";
    case "sketch":
      return "design";
    case "split":
    case "type":
    case "join":
    case "bounce":
      return "engineering";
    case "inspect":
    case "verdict":
      return "qa";
    case "launch":
      return "release";
    case "travel":
      return leg.to;
    default:
      return assertNever(leg);
  }
}

/** The station a step happens at; null for a trip between stations. */
export function stationOf(leg: Leg): StationId | null {
  return leg.kind === "travel" || leg.kind === "bounce" ? null : headingOf(leg);
}

/**
 * The office script for one ticket: its steps in order with their timings, as a pure function of the
 * seconds since it left the inbox. It answers where the ticket is at any moment, and when it first gets
 * to and finally leaves each station, so tickets can follow one another without meeting.
 */
export class TicketRoute {
  private readonly starts: readonly number[];
  private readonly total: number;

  public constructor(
    private readonly legs: readonly Leg[],
    private readonly timing: LegTiming,
  ) {
    if (legs.length === 0) {
      throw new Error("A route needs at least one step");
    }
    for (const kind of Object.keys(timing) as LegKind[]) {
      if (!(timing[kind] > 0) || !Number.isFinite(timing[kind])) {
        throw new Error(`Every step takes some time: ${kind} takes ${timing[kind]}`);
      }
    }
    const starts: number[] = [];
    let clock = 0;
    for (const leg of legs) {
      starts.push(clock);
      clock += timing[leg.kind];
    }
    this.starts = starts;
    this.total = clock;
  }

  /** Seconds from the inbox to the rocket back on its pad. */
  public length(): number {
    return this.total;
  }

  /** Whether the trip is over `seconds` after it began. */
  public over(seconds: number): boolean {
    return seconds >= this.total;
  }

  /** Where the ticket is `seconds` into its trip; held at the first step before it and the last after it. */
  public at(seconds: number): Beat {
    const clamped = Math.min(Math.max(0, seconds), this.total);
    let index = this.legs.length - 1;
    while (index > 0 && this.starts[index] > clamped) {
      index -= 1;
    }
    const leg = this.legs[index];
    const progress = Math.min(1, (clamped - this.starts[index]) / this.timing[leg.kind]);
    return { leg, index, progress };
  }

  /** Step `index` of the route. */
  public leg(index: number): Leg {
    const leg = this.legs[index];
    if (leg === undefined) {
      throw new Error(`The route has no step ${index}`);
    }
    return leg;
  }

  /** How many times QA sends it back. */
  public bounces(): number {
    return this.legs.filter((leg) => leg.kind === "bounce").length;
  }

  /** Seconds from the start until the ticket first gets to `station`; null if it never does. */
  public firstArrival(station: StationId): number | null {
    const index = this.legs.findIndex((leg) => stationOf(leg) === station);
    return index < 0 ? null : this.starts[index];
  }

  /** Seconds from the start until the ticket leaves `station` for the last time; null if it never gets there. */
  public lastLeave(station: StationId): number | null {
    for (let index = this.legs.length - 1; index >= 0; index -= 1) {
      if (stationOf(this.legs[index]) === station) {
        return this.starts[index] + this.timing[this.legs[index].kind];
      }
    }
    return null;
  }

  /**
   * The soonest a ticket on `next` may set off, `margin` seconds clear at every station, behind this one,
   * which set off at `start`: it never reaches a station before this one has left it for good.
   */
  public earliestFollower(start: number, next: TicketRoute, margin: number): number {
    let earliest = start;
    for (const station of STATIONS) {
      const leave = this.lastLeave(station);
      const arrive = next.firstArrival(station);
      if (leave !== null && arrive !== null) {
        earliest = Math.max(earliest, start + leave + margin - arrive);
      }
    }
    return earliest;
  }
}

const STATIONS: readonly StationId[] = ["product", "design", "engineering", "qa", "release"];
