import { MAX_FRAME_MS, type FrameScheduler } from "./browser";

/** Something that lives on the screen's animation frames. */
export interface FrameListener {
  /** One frame at `now` (the frames' clock), `stepMs` after the last one; the first frame's step is 0. */
  frame(now: number, stepMs: number): void;
  /** The frames stopped: the panel went off screen. */
  halt(): void;
}

/**
 * The screen's idle life, on animation frames while the panel is on screen. Each frame goes to the listeners
 * in order; a frame is never counted as longer than `MAX_FRAME_MS`, so a tab that was hidden does not
 * fast-forward.
 */
export class FrameLoop {
  private handle: number | null = null;
  private last: number | null = null;

  public constructor(
    private readonly frames: FrameScheduler,
    private readonly listeners: readonly FrameListener[],
  ) {}

  /** Starts the frames; the panel came on screen. */
  public start(): void {
    if (this.handle === null) {
      this.last = null;
      this.handle = this.frames.request(this.tick);
    }
  }

  /** Stops the frames and tells the listeners. */
  public stop(): void {
    if (this.handle !== null) {
      this.frames.cancel(this.handle);
      this.handle = null;
    }
    for (const listener of this.listeners) {
      listener.halt();
    }
  }

  private readonly tick = (now: number): void => {
    const step = this.last === null ? 0 : Math.min(MAX_FRAME_MS, Math.max(0, now - this.last));
    this.last = now;
    for (const listener of this.listeners) {
      listener.frame(now, step);
    }
    this.handle = this.frames.request(this.tick);
  };
}
