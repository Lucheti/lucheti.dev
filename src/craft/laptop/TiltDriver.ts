import { MAX_FRAME_MS, type FrameScheduler } from "./browser";
import type { DevicePose } from "./DevicePose";

/**
 * Puts the laptop's pose on the page: writes it as CSS custom properties on the device element, on
 * animation frames only while the lean is moving. Off (for phones and reduced motion) it holds the rest pose.
 */
export class TiltDriver {
  private element: HTMLElement | null = null;
  private handle: number | null = null;
  private last: number | null = null;
  private enabled = false;

  public constructor(
    private readonly pose: DevicePose,
    private readonly frames: FrameScheduler,
  ) {}

  /** Ref callback for the element that carries the pose. */
  public readonly bind = (element: HTMLElement | null): void => {
    this.element = element;
    this.write();
  };

  /** Lets the laptop lean, or holds it at rest. */
  public enable(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.pose.release();
      this.pose.settle(Number.POSITIVE_INFINITY);
      this.stop();
      this.write();
    }
  }

  /** Leans toward a pointer at (`x`, `y`) in a box of `width` × `height`. */
  public aim(x: number, y: number, width: number, height: number): void {
    if (this.enabled) {
      this.pose.aim(x, y, width, height);
      this.run();
    }
  }

  /** The pointer left: ease back. */
  public release(): void {
    this.pose.release();
    this.run();
  }

  /** Stops the frames, when the panel goes away. */
  public stop(): void {
    if (this.handle !== null) {
      this.frames.cancel(this.handle);
      this.handle = null;
    }
    this.last = null;
  }

  private run(): void {
    if (this.handle === null && this.enabled) {
      this.handle = this.frames.request(this.tick);
    }
  }

  private readonly tick = (now: number): void => {
    const seconds = this.last === null ? 1 / 60 : Math.min(MAX_FRAME_MS, now - this.last) / 1000;
    this.last = now;
    this.pose.settle(seconds);
    this.write();
    if (this.pose.resting()) {
      this.handle = null;
      this.last = null;
      return;
    }
    this.handle = this.frames.request(this.tick);
  };

  private write(): void {
    if (this.element === null) {
      return;
    }
    const { rotateX, rotateY, glare } = this.pose.pose();
    this.element.style.setProperty("--rx", `${rotateX.toFixed(3)}deg`);
    this.element.style.setProperty("--ry", `${rotateY.toFixed(3)}deg`);
    this.element.style.setProperty("--glare", glare.toFixed(4));
  }
}
