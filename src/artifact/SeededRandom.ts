/**
 * Deterministic random numbers (mulberry32).
 *
 * The scatter layout must be identical on every load, so nothing in the
 * artifact may touch Math.random.
 */
export class SeededRandom {
  private state: number;

  public constructor(seed: number) {
    if (!Number.isInteger(seed)) {
      throw new RangeError(`Seed must be an integer, got ${seed}`);
    }
    this.state = seed >>> 0;
  }

  /** Uniform in [0, 1). */
  public next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Uniform in [from, to). */
  public between(from: number, to: number): number {
    return from + (to - from) * this.next();
  }

  /** Fisher-Yates shuffle of 0 … count-1. */
  public permutation(count: number): number[] {
    const order = Array.from({ length: count }, (_, i) => i);
    for (let i = count - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  }
}
