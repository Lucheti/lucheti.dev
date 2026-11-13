/** Where the features sit in the portrait image, as fractions of its width (x) and height (y). */
export type PortraitAnchors = Readonly<{
  /** Horizontal centre of the head. */
  headX: number;
  /** Top of the head. */
  headTop: number;
  /** Centre of the face. */
  faceY: number;
}>;

/** Where the cutout sits in the circle, as fractions of the circle's diameter. */
export type FramingTarget = Readonly<{
  /** Image width relative to the diameter. */
  widthRatio: number;
  /** Where the face centre lands, measured from the top of the circle. */
  faceAt: number;
}>;

/** A margin the head must keep from the top of the circle, as a fraction of the diameter. */
const MIN_HEAD_CLEARANCE = 0.08;

/**
 * Places a cutout portrait inside a circular clip. The rule it guards: the head is never cropped
 * at the top, and the image still reaches past the bottom edge so the shoulders fill the circle.
 */
export class PortraitFraming {
  private readonly height: number;
  private readonly topOffset: number;

  public constructor(
    aspect: number,
    private readonly anchors: PortraitAnchors,
    private readonly target: FramingTarget,
  ) {
    if (!(aspect > 0)) {
      throw new RangeError("aspect must be positive");
    }
    this.height = target.widthRatio / aspect;
    this.topOffset = target.faceAt - anchors.faceY * this.height;

    const headTopAt = this.topOffset + anchors.headTop * this.height;
    if (headTopAt < MIN_HEAD_CLEARANCE) {
      throw new RangeError("the head would be cropped at the top of the circle");
    }
    if (this.topOffset + this.height < 1) {
      throw new RangeError("the image must run off the bottom of the circle");
    }
  }

  /** Image width as a percentage of the circle. */
  public widthPercent(): number {
    return this.target.widthRatio * 100;
  }

  /** Image left edge as a percentage of the circle; centres the head horizontally. */
  public leftPercent(): number {
    return (0.5 - this.anchors.headX * this.target.widthRatio) * 100;
  }

  /** Image top edge as a percentage of the circle. */
  public topPercent(): number {
    return this.topOffset * 100;
  }
}
