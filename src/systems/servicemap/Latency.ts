/**
 * A service's p95 latency in ms. Under load it heads for a higher level and gets there gradually, then
 * settles back to its base the same way, as a real percentile over a sliding window would.
 */
export class Latency {
  private value: number;

  public constructor(
    private readonly base: number,
    /** How much each extra multiple of the steady traffic adds, as a share of the base. */
    private readonly sensitivity: number,
    /** How quickly it follows its target: the time constant, in ms. */
    private readonly settleMs: number,
  ) {
    if (!(base > 0) || !(sensitivity >= 0) || !(settleMs > 0)) {
      throw new Error(`A latency needs a base, a sensitivity and a time to settle: ${base}, ${sensitivity}, ${settleMs}`);
    }
    this.value = base;
  }

  /** Lets `ms` pass under `load` times the steady traffic. */
  public advance(ms: number, load: number): void {
    const target = this.base * (1 + this.sensitivity * Math.max(0, load - 1));
    this.value = target + (this.value - target) * Math.exp(-ms / this.settleMs);
  }

  /** The p95 now, in whole ms. */
  public p95(): number {
    return Math.round(this.value);
  }

  /** Whether it is back within `share` of its base. */
  public settled(share: number): boolean {
    return this.value <= this.base * (1 + share);
  }
}
