import type { FrameSet } from "@/content";

const MAX_DEVICE_PIXEL_RATIO = 2;

/**
 * Chooses which resolution of the sequence to download.
 *
 * Guards the rule that the sets are ordered smallest to largest, which is what
 * lets "the smallest that is wide enough" be a single forward scan.
 */
export class FrameSetSelector {
  public constructor(private readonly sets: readonly FrameSet[]) {
    if (sets.length === 0) {
      throw new RangeError("A frame sequence needs at least one frame set");
    }
    for (let i = 1; i < sets.length; i += 1) {
      if (sets[i].width <= sets[i - 1].width) {
        throw new RangeError("Frame sets must be ordered from smallest to largest width");
      }
    }
  }

  /** Index of the smallest set covering the canvas's pixels, else of the largest. */
  public indexFor(cssWidth: number, devicePixelRatio: number): number {
    const needed = cssWidth * Math.min(devicePixelRatio, MAX_DEVICE_PIXEL_RATIO);
    const index = this.sets.findIndex((set) => set.width >= needed);
    return index === -1 ? this.sets.length - 1 : index;
  }

  public setAt(index: number): FrameSet {
    return this.sets[index];
  }
}
