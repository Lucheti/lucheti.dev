const SETTLED_DISTANCE = 0.001;
const REFERENCE_FRAME_MS = 1000 / 60;

/**
 * A displayed value that chases its target, giving the scrub its weight.
 *
 * `rate` is the fraction of the remaining distance covered per 60Hz frame; the
 * elapsed time is folded in so a 120Hz display feels the same. A rate of 1
 * follows the target instantly.
 */
export class Inertia {
  public constructor(
    private value: number,
    private readonly rate: number,
  ) {
    if (!(rate > 0 && rate <= 1)) {
      throw new RangeError(`Rate must be in (0, 1], got ${rate}`);
    }
  }

  public current(): number {
    return this.value;
  }

  /** Moves towards `target`; returns whether the value changed. */
  public advance(target: number, elapsedMs: number): boolean {
    const remaining = target - this.value;
    if (remaining === 0) {
      return false;
    }
    if (Math.abs(remaining) < SETTLED_DISTANCE) {
      this.value = target;
      return true;
    }
    const share = 1 - Math.pow(1 - this.rate, Math.max(0, elapsedMs) / REFERENCE_FRAME_MS);
    this.value += remaining * share;
    return true;
  }

  public isSettledAt(target: number): boolean {
    return this.value === target;
  }
}
