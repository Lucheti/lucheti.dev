/** A source of numbers in [0, 1). */
export interface Draws {
  next(): number;
}

/** Decides, run by run, whether the first test run fails. */
export interface FailureDraw {
  /** Whether the next run's tests fail first. */
  next(): boolean;
}

/** Fails about `rate` of the runs, in an order fixed by a seeded source, so every visitor sees the same runs. */
export class SeededFailures implements FailureDraw {
  public constructor(
    private readonly draws: Draws,
    private readonly rate: number,
  ) {
    if (!(rate > 0 && rate < 1)) {
      throw new Error(`A failure rate is between 0 and 1: ${rate}`);
    }
  }

  public next(): boolean {
    return this.draws.next() < this.rate;
  }
}
