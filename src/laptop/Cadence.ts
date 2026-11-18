/**
 * A beat that falls every `everyMs` of elapsed time, the first one `firstMs` in: how often a new task
 * arrives. Fed elapsed time in steps, it says how many beats fell in each step.
 */
export class Cadence {
  private untilNext: number;

  public constructor(
    private readonly everyMs: number,
    firstMs: number,
  ) {
    if (!(everyMs > 0) || !Number.isFinite(everyMs)) {
      throw new Error(`A cadence needs a period above zero: ${everyMs}`);
    }
    if (!(firstMs >= 0) || !Number.isFinite(firstMs)) {
      throw new Error(`The first beat must be zero or more ms in: ${firstMs}`);
    }
    this.untilNext = firstMs;
  }

  /** Lets `ms` pass; returns how many beats fell in it. */
  public advance(ms: number): number {
    if (!(ms >= 0) || !Number.isFinite(ms)) {
      throw new Error(`Time only moves forward: ${ms}`);
    }
    let beats = 0;
    this.untilNext -= ms;
    while (this.untilNext <= 0) {
      beats += 1;
      this.untilNext += this.everyMs;
    }
    return beats;
  }
}
