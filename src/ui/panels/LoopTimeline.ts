/** A run of beats of fixed lengths that repeats forever: maps elapsed time to the beat playing and how far in it is. */
export class LoopTimeline {
  private readonly ends: readonly number[];
  private readonly total: number;

  /** `durations` are the beats' lengths in ms, in order; there must be at least one, each above zero. */
  public constructor(durations: readonly number[]) {
    if (durations.length === 0) {
      throw new Error("A loop needs at least one beat");
    }
    if (durations.some((duration) => !Number.isFinite(duration) || duration <= 0)) {
      throw new Error(`Every beat must last a finite time above zero: ${durations.join(", ")}`);
    }
    let sum = 0;
    this.ends = durations.map((duration) => (sum += duration));
    this.total = sum;
  }

  /** One pass of the loop, in ms. */
  public duration(): number {
    return this.total;
  }

  /** The index of the beat playing `elapsedMs` after the loop started. */
  public beatAt(elapsedMs: number): number {
    const time = this.wrap(elapsedMs);
    for (let beat = 0; beat < this.ends.length; beat += 1) {
      if (time < this.ends[beat]) {
        return beat;
      }
    }
    return this.ends.length - 1;
  }

  /** How far through its beat the loop is at `elapsedMs`, from 0 to just under 1. */
  public progressAt(elapsedMs: number): number {
    const time = this.wrap(elapsedMs);
    const beat = this.beatAt(time);
    const start = beat === 0 ? 0 : this.ends[beat - 1];
    return (time - start) / (this.ends[beat] - start);
  }

  private wrap(elapsedMs: number): number {
    const time = elapsedMs % this.total;
    return time < 0 ? time + this.total : time;
  }
}
