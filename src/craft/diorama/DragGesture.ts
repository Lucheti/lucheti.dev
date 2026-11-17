/** What a pointer move means: a hover with no button down, a press not yet moved far enough, a drag starting, or a drag going on. */
export type GestureMove =
  | Readonly<{ kind: "hover" }>
  | Readonly<{ kind: "pending" }>
  | Readonly<{ kind: "start"; dx: number }>
  | Readonly<{ kind: "drag"; dx: number }>;

/**
 * Tells a click from a drag: a press becomes a drag only once the pointer has moved `threshold` pixels
 * across, so a slightly shaky click still clicks. Pure; it is fed the pointer's x.
 */
export class DragGesture {
  private origin: number | null = null;
  private dragging = false;

  public constructor(private readonly threshold: number) {
    if (!(threshold >= 0)) {
      throw new Error(`A drag threshold cannot be negative: ${threshold}`);
    }
  }

  /** A button went down at `x`. */
  public down(x: number): void {
    this.origin = x;
    this.dragging = false;
  }

  /** The pointer moved to `x`. */
  public move(x: number): GestureMove {
    if (this.origin === null) {
      return { kind: "hover" };
    }
    const dx = x - this.origin;
    if (this.dragging) {
      return { kind: "drag", dx };
    }
    if (Math.abs(dx) < this.threshold) {
      return { kind: "pending" };
    }
    this.dragging = true;
    return { kind: "start", dx };
  }

  /** The button came up or the press was cancelled. Returns whether it had become a drag. */
  public up(): boolean {
    const dragged = this.dragging;
    this.origin = null;
    this.dragging = false;
    return dragged;
  }

  /** Whether a drag is going on. */
  public active(): boolean {
    return this.dragging;
  }
}
