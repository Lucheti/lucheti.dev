import { MathUtils } from "three";

const LAMBDA = 3;

/**
 * Follows the mouse across the window, damped, as −1…1 on both axes (y up).
 * Touch pointers are ignored: a finger is not a gaze.
 */
export class PointerLean {
  private targetX = 0;
  private targetY = 0;
  private dampedX = 0;
  private dampedY = 0;

  public x(): number {
    return this.dampedX;
  }

  public y(): number {
    return this.dampedY;
  }

  /** Starts listening; returns the function that stops. */
  public listen(target: Window): () => void {
    const onMove = (event: PointerEvent): void => {
      if (event.pointerType === "touch") return;
      this.aimAt(event.clientX, event.clientY, target.innerWidth, target.innerHeight);
    };
    target.addEventListener("pointermove", onMove, { passive: true });
    return () => target.removeEventListener("pointermove", onMove);
  }

  public aimAt(clientX: number, clientY: number, width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    this.targetX = MathUtils.clamp((clientX / width) * 2 - 1, -1, 1);
    this.targetY = MathUtils.clamp(1 - (clientY / height) * 2, -1, 1);
  }

  public settle(seconds: number): void {
    this.dampedX = MathUtils.damp(this.dampedX, this.targetX, LAMBDA, seconds);
    this.dampedY = MathUtils.damp(this.dampedY, this.targetY, LAMBDA, seconds);
  }
}
