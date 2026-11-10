/** The frames that have arrived so far, addressed by zero-based index. */
export class FrameStore<T> {
  private readonly frames: (T | undefined)[];
  private loaded = 0;

  public constructor(private readonly frameCount: number) {
    if (!Number.isInteger(frameCount) || frameCount < 1) {
      throw new RangeError(`A store needs at least one slot, got ${frameCount}`);
    }
    this.frames = new Array<T | undefined>(frameCount).fill(undefined);
  }

  public put(index: number, frame: T): void {
    this.assertInRange(index);
    if (this.frames[index] === undefined) {
      this.loaded += 1;
    }
    this.frames[index] = frame;
  }

  public get(index: number): T | undefined {
    return this.frames[index];
  }

  public loadedCount(): number {
    return this.loaded;
  }

  /**
   * Index of the loaded frame closest to `wanted`; the earlier one wins a tie
   * so the picture lags the scroll rather than jumping ahead of it.
   */
  public nearestIndex(wanted: number): number | undefined {
    if (this.loaded === 0) {
      return undefined;
    }
    const start = Math.min(this.frameCount - 1, Math.max(0, Math.round(wanted)));
    for (let distance = 0; distance < this.frameCount; distance += 1) {
      const before = start - distance;
      if (before >= 0 && this.frames[before] !== undefined) {
        return before;
      }
      const after = start + distance;
      if (after < this.frameCount && this.frames[after] !== undefined) {
        return after;
      }
    }
    return undefined;
  }

  private assertInRange(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.frameCount) {
      throw new RangeError(`Frame ${index} is outside 0…${this.frameCount - 1}`);
    }
  }
}
