import type { Progress } from "@/story";

/**
 * A fractional place inside a frame sequence: the whole part picks a frame,
 * the fractional part says how far we are towards the one after it.
 *
 * Guards the rule that a position never leaves [0, frameCount - 1], so the
 * floor and next indices are always valid frames.
 */
export class FramePosition {
  private readonly value: number;

  public constructor(
    value: number,
    private readonly frameCount: number,
  ) {
    if (!Number.isInteger(frameCount) || frameCount < 1) {
      throw new RangeError(`A sequence needs at least one frame, got ${frameCount}`);
    }
    if (!Number.isFinite(value)) {
      throw new RangeError(`Frame position must be finite, got ${value}`);
    }
    this.value = Math.min(frameCount - 1, Math.max(0, value));
  }

  /** Maps the whole page journey across every frame of the sequence. */
  public static fromProgress(progress: Progress, frameCount: number): FramePosition {
    return new FramePosition(progress.toNumber() * (frameCount - 1), frameCount);
  }

  public toNumber(): number {
    return this.value;
  }

  public floorIndex(): number {
    return Math.min(this.frameCount - 1, Math.floor(this.value));
  }

  public nextIndex(): number {
    return Math.min(this.frameCount - 1, this.floorIndex() + 1);
  }

  /** Opacity of the next frame laid over the floor frame; 0 on an exact frame and at the end. */
  public mix(): number {
    return this.floorIndex() === this.nextIndex() ? 0 : this.value - this.floorIndex();
  }
}
