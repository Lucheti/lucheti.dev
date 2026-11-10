/**
 * The order frames are requested in: the first frame, then a coarse pass of
 * every `stride`-th frame, then everything else in sequence. After the coarse
 * pass any scroll position is within `stride / 2` frames of something drawable.
 */
export class LoadOrder {
  public constructor(
    private readonly frameCount: number,
    private readonly stride: number,
  ) {
    if (!Number.isInteger(frameCount) || frameCount < 1) {
      throw new RangeError(`A sequence needs at least one frame, got ${frameCount}`);
    }
    if (!Number.isInteger(stride) || stride < 1) {
      throw new RangeError(`Stride must be a positive integer, got ${stride}`);
    }
  }

  public indices(): readonly number[] {
    const order: number[] = [];
    for (let i = 0; i < this.frameCount; i += this.stride) {
      order.push(i);
    }
    for (let i = 0; i < this.frameCount; i += 1) {
      if (i % this.stride !== 0) {
        order.push(i);
      }
    }
    return order;
  }

  /** How many frames the first frame plus the coarse pass amount to. */
  public coarseCount(): number {
    return Math.ceil(this.frameCount / this.stride);
  }
}
