/** Fractions of the viewport width that place the track's parts. */
const START_RATIO = 0.45;
const READING_RATIO = 0.42;
const SPACING_RATIO = 0.38;
const MIN_SPACING_PX = 340;

export type BarFill = Readonly<{
  /** 0..1 fill of the ink segment, which ends at the marker. */
  before: number;
  /** 0..1 fill of the orange segment, which starts at the marker. */
  after: number;
}>;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * The maths of the pinned horizontal track, in pixels. The track is the viewport plus
 * exactly the distance between the first and last stop, so the pin lasts as long as
 * the track needs and the last stop ends where the first one began.
 */
export class TimelineGeometry {
  public constructor(
    private readonly viewportWidth: number,
    private readonly stopCount: number,
    private readonly markerAfterStop: number,
  ) {
    if (!(viewportWidth > 0)) {
      throw new RangeError("viewportWidth must be positive");
    }
    if (!Number.isInteger(stopCount) || stopCount < 1) {
      throw new RangeError("stopCount must be a positive integer");
    }
    if (!Number.isInteger(markerAfterStop) || markerAfterStop < 0 || markerAfterStop >= stopCount) {
      throw new RangeError("markerAfterStop must index an existing stop");
    }
  }

  public spacing(): number {
    return Math.max(MIN_SPACING_PX, this.viewportWidth * SPACING_RATIO);
  }

  public readingX(): number {
    return this.viewportWidth * READING_RATIO;
  }

  /** Horizontal centre of a stop's node, in track coordinates. */
  public stopX(index: number): number {
    return this.viewportWidth * START_RATIO + index * this.spacing();
  }

  /** How far the track travels, which is also how much extra scroll the pin needs. */
  public travel(): number {
    return (this.stopCount - 1) * this.spacing();
  }

  public trackWidth(): number {
    return this.viewportWidth + this.travel();
  }

  /** Halfway between the stop before the marker and the one after it. */
  public markerX(): number {
    return this.stopX(this.markerAfterStop) + this.spacing() / 2;
  }

  /** Track offset (zero or negative) for a scroll progress of 0..1. */
  public xAt(progress: number): number {
    return -clamp01(progress) * this.travel();
  }

  public progressAt(x: number): number {
    const travel = this.travel();
    return travel === 0 ? 0 : clamp01(-x / travel);
  }

  /** The stop whose column is closest to the reading line for a track offset. */
  public activeIndex(x: number): number {
    const reading = this.readingX();
    let best = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let index = 0; index < this.stopCount; index += 1) {
      const distance = Math.abs(this.stopX(index) + x - reading);
      if (distance < bestDistance) {
        best = index;
        bestDistance = distance;
      }
    }
    return best;
  }

  /** The scroll progress at which the reading line meets the marker. */
  public markerProgress(): number {
    const travel = this.travel();
    return travel === 0 ? 0 : clamp01((this.markerX() - this.readingX()) / travel);
  }

  /** Splits one progress value across the ink and orange segments of the progress bar. */
  public barFill(progress: number): BarFill {
    const at = clamp01(progress);
    const marker = this.markerProgress();
    return {
      before: marker === 0 ? 1 : clamp01(at / marker),
      after: marker === 1 ? 0 : clamp01((at - marker) / (1 - marker)),
    };
  }
}
