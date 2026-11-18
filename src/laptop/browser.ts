/** Schedules a callback for the next animation frame. */
export interface FrameScheduler {
  request(callback: (now: number) => void): number;
  cancel(handle: number): void;
}

/** Runs a callback after a delay; returns the cancel. */
export interface Timers {
  after(ms: number, callback: () => void): () => void;
}

/** The browser's animation frames. */
export class BrowserFrames implements FrameScheduler {
  /** Asks for the next animation frame. */
  public request(callback: (now: number) => void): number {
    return requestAnimationFrame(callback);
  }

  /** Cancels a requested frame. */
  public cancel(handle: number): void {
    cancelAnimationFrame(handle);
  }
}

/** The browser's timeouts. */
export class BrowserTimers implements Timers {
  /** Calls back after `ms`; the returned function cancels it. */
  public after(ms: number, callback: () => void): () => void {
    const handle = window.setTimeout(callback, ms);
    return () => window.clearTimeout(handle);
  }
}

/** A frame is never counted as longer than this, so a tab that was hidden does not fast-forward. */
export const MAX_FRAME_MS = 100;
