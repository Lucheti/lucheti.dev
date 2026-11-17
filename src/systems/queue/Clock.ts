/** A source of the current time, in ms. */
export interface Clock {
  now(): number;
}

/** A clock that only moves when told to: tests step it by hand, the panel steps it once per frame. */
export class ManualClock implements Clock {
  private time: number;

  public constructor(start = 0) {
    if (!Number.isFinite(start)) {
      throw new Error(`A clock must start at a finite time: ${start}`);
    }
    this.time = start;
  }

  /** The current time, in ms. */
  public now(): number {
    return this.time;
  }

  /** Moves the clock forward by `ms`, which must be zero or more. */
  public advance(ms: number): void {
    if (!Number.isFinite(ms) || ms < 0) {
      throw new Error(`A clock only moves forward: ${ms}`);
    }
    this.time += ms;
  }
}
