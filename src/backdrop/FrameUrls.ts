import type { FrameSet } from "@/content";

/** Names frame files: `{directory}/0001.webp` is the first frame (index 0). */
export class FrameUrls {
  public constructor(private readonly set: FrameSet) {}

  public forIndex(index: number): string {
    if (!Number.isInteger(index) || index < 0) {
      throw new RangeError(`Frame index must be a non-negative integer, got ${index}`);
    }
    return `${this.set.directory}/${String(index + 1).padStart(4, "0")}.webp`;
  }
}
