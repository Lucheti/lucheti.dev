/** A small deterministic random source (mulberry32): the same seed always yields the same sequence. */
export class SeededRandom {
  private state: number;

  /** Any integer works as a seed; it is folded into 32 bits. */
  public constructor(seed: number) {
    if (!Number.isFinite(seed)) {
      throw new Error(`A seed must be a finite number, not ${seed}`);
    }
    this.state = Math.trunc(seed) >>> 0;
  }

  /** The next float in [0, 1). */
  public next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** An integer in [min, max], both included. */
  public int(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new Error(`An integer range needs whole bounds in order, not ${min}..${max}`);
    }
    return min + Math.floor(this.next() * (max - min + 1));
  }
}
