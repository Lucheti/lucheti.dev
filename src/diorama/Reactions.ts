import { SETTLED_AFTER } from "./curves";
import type { TargetKind } from "./Target";

/** Seconds from some fixed moment, only ever growing. */
export interface Clock {
  now(): number;
}

/** The browser's high-resolution clock, in seconds. */
export class BrowserClock implements Clock {
  public now(): number {
    return performance.now() / 1000;
  }
}

/**
 * When each thing on the island was last clicked, so its reaction (a press, a squash, a wiggle) can be
 * drawn as a curve of its age. Clicking again restarts it.
 */
export class Reactions {
  private readonly kicks = new Map<TargetKind, number>();

  public constructor(private readonly clock: Clock) {}

  /** `kind` was just clicked. */
  public kick(kind: TargetKind): void {
    this.kicks.set(kind, this.clock.now());
  }

  /** Seconds since `kind` was last clicked; infinite if it never was. */
  public age(kind: TargetKind): number {
    const at = this.kicks.get(kind);
    return at === undefined ? Number.POSITIVE_INFINITY : this.clock.now() - at;
  }

  /** Whether any reaction is still playing. */
  public lively(): boolean {
    const now = this.clock.now();
    for (const at of this.kicks.values()) {
      if (now - at < SETTLED_AFTER) {
        return true;
      }
    }
    return false;
  }
}
