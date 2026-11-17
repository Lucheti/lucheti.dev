import type { Anchor, FlightView } from "./types";

type Flight = Readonly<{ id: number; from: Anchor; to: Anchor; start: number; duration: number }>;

/** Messages in the air between two anchors, each landing after its own flight time. */
export class Flights {
  private readonly flights: Flight[] = [];

  /** Sends message `id` from one anchor to another, leaving at `start`. */
  public launch(id: number, from: Anchor, to: Anchor, start: number, duration: number): void {
    if (!(duration > 0)) {
      throw new Error(`A flight needs a positive duration: ${duration}`);
    }
    this.flights.push({ id, from, to, start, duration });
  }

  /** Removes and returns the flights that have arrived by `now`, in the order they left. */
  public land(now: number): readonly Flight[] {
    const landed: Flight[] = [];
    for (let index = 0; index < this.flights.length; ) {
      const flight = this.flights[index];
      if (flight.start + flight.duration <= now) {
        landed.push(flight);
        this.flights.splice(index, 1);
      } else {
        index += 1;
      }
    }
    return landed;
  }

  /** How many are in the air. */
  public count(): number {
    return this.flights.length;
  }

  /** Each flight with its progress at `now`. */
  public views(now: number): readonly FlightView[] {
    return this.flights.map((flight) => ({
      id: flight.id,
      from: flight.from,
      to: flight.to,
      progress: Math.min(1, Math.max(0, (now - flight.start) / flight.duration)),
    }));
  }
}
