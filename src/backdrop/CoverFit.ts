export type Size = Readonly<{ width: number; height: number }>;

export type Rect = Readonly<{ x: number; y: number; width: number; height: number }>;

/**
 * Scales a frame to fill a canvas, cropping the overflow around a focal point.
 *
 * A focal x of 0.62 means 62% of the horizontal overflow is cropped from the
 * left, so the part of the frame near 62% across stays in view on narrow
 * screens. The last result is memoised because the same frame and canvas are
 * fitted on every repaint and the paint loop must not allocate.
 */
export class CoverFit {
  private lastFrame: Size | undefined;
  private lastCanvas: Size | undefined;
  private lastRect: Rect = { x: 0, y: 0, width: 0, height: 0 };

  public constructor(
    private readonly focalX: number,
    private readonly focalY: number,
  ) {
    if (!(focalX >= 0 && focalX <= 1 && focalY >= 0 && focalY <= 1)) {
      throw new RangeError("Focal point must lie within the frame");
    }
  }

  public rectFor(frame: Size, canvas: Size): Rect {
    if (frame.width <= 0 || frame.height <= 0) {
      throw new RangeError("A frame needs a positive size");
    }
    if (this.isLast(frame, canvas)) {
      return this.lastRect;
    }
    const scale = Math.max(canvas.width / frame.width, canvas.height / frame.height);
    const width = frame.width * scale;
    const height = frame.height * scale;
    this.lastFrame = { width: frame.width, height: frame.height };
    this.lastCanvas = { width: canvas.width, height: canvas.height };
    this.lastRect = {
      x: (canvas.width - width) * this.focalX,
      y: (canvas.height - height) * this.focalY,
      width,
      height,
    };
    return this.lastRect;
  }

  private isLast(frame: Size, canvas: Size): boolean {
    return (
      this.lastFrame !== undefined &&
      this.lastCanvas !== undefined &&
      this.lastFrame.width === frame.width &&
      this.lastFrame.height === frame.height &&
      this.lastCanvas.width === canvas.width &&
      this.lastCanvas.height === canvas.height
    );
  }
}
