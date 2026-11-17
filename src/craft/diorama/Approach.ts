/** Closer than this, a value has arrived. */
const ARRIVED = 1e-3;

/**
 * A value that eases toward wherever it is sent, quickly at first and gently at the end, at the same pace
 * however the time is sliced. Used for things that change state and should glide there: a toggle's knob, a
 * star lighting up, the lamp warming.
 */
export class Approach {
  private current: number;

  /** `rate` is how quickly it closes the gap, per second: higher is snappier. */
  public constructor(
    start: number,
    private readonly rate: number,
  ) {
    if (!(rate > 0) || !Number.isFinite(rate) || !Number.isFinite(start)) {
      throw new Error(`An approach needs a finite start and a finite rate above zero: ${start}, ${rate}`);
    }
    this.current = start;
  }

  /** Moves `seconds` closer to `target`; within a hair of it, lands exactly. */
  public toward(target: number, seconds: number): number {
    const follow = 1 - Math.exp(-this.rate * Math.max(0, seconds));
    this.current += (target - this.current) * follow;
    if (Math.abs(target - this.current) < ARRIVED) {
      this.current = target;
    }
    return this.current;
  }

  /** Jumps to `target` at once, for reduced motion. */
  public snap(target: number): number {
    this.current = target;
    return this.current;
  }

  /** Where it is now. */
  public value(): number {
    return this.current;
  }

  /** Whether it has arrived at `target`. */
  public at(target: number): boolean {
    return this.current === target;
  }
}
