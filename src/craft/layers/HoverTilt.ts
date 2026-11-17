/**
 * The model's lean toward the pointer while it hovers the panel: a target from −1 to 1 on each axis (y up)
 * and a damped value that follows it, so the model eases over rather than snapping. Leaving lets it settle
 * back to rest.
 */
export class HoverTilt {
  private targetX = 0;
  private targetY = 0;
  private currentX = 0;
  private currentY = 0;

  /** `lambda` is how quickly the lean follows, per second: higher is snappier. */
  public constructor(private readonly lambda: number) {
    if (!(lambda > 0) || !Number.isFinite(lambda)) {
      throw new Error(`The follow rate must be finite and above zero: ${lambda}`);
    }
  }

  /** Aims at a pointer at (`x`, `y`) inside a box of `width` × `height`, measured from its top left. */
  public aim(x: number, y: number, width: number, height: number): void {
    if (!(width > 0) || !(height > 0)) {
      return;
    }
    this.targetX = HoverTilt.unit((x / width) * 2 - 1);
    this.targetY = HoverTilt.unit(1 - (y / height) * 2);
  }

  /** The pointer left: ease back to rest. */
  public release(): void {
    this.targetX = 0;
    this.targetY = 0;
  }

  /** Moves the lean `seconds` closer to its target. */
  public settle(seconds: number): void {
    const follow = 1 - Math.exp(-this.lambda * Math.max(0, seconds));
    this.currentX += (this.targetX - this.currentX) * follow;
    this.currentY += (this.targetY - this.currentY) * follow;
  }

  /** The lean across, −1 (left) to 1 (right). */
  public x(): number {
    return this.currentX;
  }

  /** The lean up and down, −1 (down) to 1 (up). */
  public y(): number {
    return this.currentY;
  }

  private static unit(value: number): number {
    return value < -1 ? -1 : value > 1 ? 1 : value;
  }
}
