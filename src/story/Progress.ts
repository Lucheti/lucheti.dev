/**
 * A fraction of a journey, always within [0, 1].
 *
 * Everything that is driven by scroll (the backdrop frames, the artifact's
 * assembly, section reveals) speaks in Progress so that no consumer has to
 * clamp, validate or guess the range of a raw number.
 */
export class Progress {
  public static readonly START: Progress = new Progress(0);
  public static readonly END: Progress = new Progress(1);

  private constructor(private readonly fraction: number) {}

  /** Clamps any finite number into range; rejects NaN and infinities. */
  public static of(fraction: number): Progress {
    if (!Number.isFinite(fraction)) {
      throw new RangeError(`Progress must be a finite number, got ${fraction}`);
    }
    return new Progress(Math.min(1, Math.max(0, fraction)));
  }

  public toNumber(): number {
    return this.fraction;
  }

  /**
   * Re-expresses this progress inside a sub-range: 0 before `from`, 1 after
   * `to`, linear in between. `from` must be strictly less than `to`.
   */
  public within(from: number, to: number): Progress {
    if (!(from < to)) {
      throw new RangeError(`Invalid window [${from}, ${to}]`);
    }
    return Progress.of((this.fraction - from) / (to - from));
  }

  /** Smoothstep easing: slow in, slow out. */
  public eased(): Progress {
    const t = this.fraction;
    return new Progress(t * t * (3 - 2 * t));
  }

  /** Linear interpolation between two numbers by this progress. */
  public mix(from: number, to: number): number {
    return from + (to - from) * this.fraction;
  }

  public equals(other: Progress): boolean {
    return this.fraction === other.fraction;
  }
}
