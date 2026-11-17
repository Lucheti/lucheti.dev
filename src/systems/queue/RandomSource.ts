/** A source of numbers in [0, 1). */
export interface RandomSource {
  next(): number;
}

/** A small seeded generator (mulberry32): the same seed always gives the same run. */
export class SeededRandom implements RandomSource {
  private state: number;

  public constructor(seed: number) {
    if (!Number.isInteger(seed)) {
      throw new Error(`A seed must be an integer: ${seed}`);
    }
    this.state = seed >>> 0;
  }

  /** The next number in [0, 1). */
  public next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

/** `mean` varied by up to `jitter` (a fraction) either way. */
export function jittered(random: RandomSource, mean: number, jitter: number): number {
  return mean * (1 + jitter * (2 * random.next() - 1));
}
