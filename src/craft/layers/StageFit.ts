import type { ScreenBounds, Vec2 } from "./IsometricView";

/** The drawing area, in CSS pixels. */
export type StageSize = Readonly<{ width: number; height: number }>;

/** How the model and its labels share the stage, in CSS pixels. */
export type FitRules = Readonly<{
  /** Kept clear on every side. */
  padding: number;
  /** The shortest leader between the model's right edge and the label column. */
  leader: number;
  /** Room for the label text, right of the column. */
  labelRoom: number;
  /** The model never draws larger than this many pixels per unit, however roomy the stage. */
  maxZoom: number;
}>;

/**
 * Fits the model's projected bounds, plus a column of labels to its right, into a stage: the zoom (pixels
 * per model unit), where the camera looks, and the label column's x. The model and its labels are centred
 * together; the model is as large as the stage allows, up to `maxZoom`.
 */
export class StageFit {
  private readonly scale: number;
  private readonly centreX: number;
  private readonly centreY: number;
  private readonly columnX: number;

  public constructor(
    private readonly stage: StageSize,
    bounds: ScreenBounds,
    rules: FitRules,
  ) {
    const boundsWidth = bounds.maxX - bounds.minX;
    const boundsHeight = bounds.maxY - bounds.minY;
    if (!(boundsWidth > 0) || !(boundsHeight > 0)) {
      throw new Error(`The model needs a size on screen: ${boundsWidth} × ${boundsHeight}`);
    }
    const roomX = stage.width - 2 * rules.padding - rules.leader - rules.labelRoom;
    const roomY = stage.height - 2 * rules.padding;
    // A stage too small to fit anything still gets a tiny, finite zoom rather than a negative one.
    this.scale = Math.max(1e-3, Math.min(roomX / boundsWidth, roomY / boundsHeight, rules.maxZoom));
    const modelWidth = boundsWidth * this.scale;
    const left = (stage.width - (modelWidth + rules.leader + rules.labelRoom)) / 2;
    this.centreX = bounds.minX - (left - stage.width / 2) / this.scale;
    this.centreY = (bounds.minY + bounds.maxY) / 2;
    this.columnX = left + modelWidth + rules.leader;
  }

  /** Pixels per model unit. */
  public zoom(): number {
    return this.scale;
  }

  /** The screen-plane point at the stage's centre, in model units: where the camera looks. */
  public lookX(): number {
    return this.centreX;
  }

  public lookY(): number {
    return this.centreY;
  }

  /** The x, in stage pixels, where every label's leader ends and its text begins. */
  public column(): number {
    return this.columnX;
  }

  /** Writes the stage pixel (y down) of a point on the screen plane (model units, y up). */
  public toStage(point: Readonly<Vec2>, out: Vec2): Vec2 {
    const x = this.stage.width / 2 + (point.x - this.centreX) * this.scale;
    const y = this.stage.height / 2 - (point.y - this.centreY) * this.scale;
    out.x = x;
    out.y = y;
    return out;
  }
}
