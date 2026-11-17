/**
 * Whether the ghost cursor may play. It yields the moment the visitor's pointer comes in, and comes back
 * `resumeMs` after the pointer leaves, unless it came back in meanwhile. Times are in ms on any one clock.
 */
export class GhostPresence {
  private inside = false;
  private leftAt = Number.NEGATIVE_INFINITY;

  public constructor(private readonly resumeMs: number) {
    if (!(resumeMs >= 0) || !Number.isFinite(resumeMs)) {
      throw new Error(`The wait before the ghost comes back must be zero or more: ${resumeMs}`);
    }
  }

  /** The visitor's pointer came into the panel. */
  public enter(): void {
    this.inside = true;
  }

  /** The visitor's pointer left the panel at `now`. */
  public leave(now: number): void {
    if (this.inside) {
      this.inside = false;
      this.leftAt = now;
    }
  }

  /** Whether the ghost plays at `now`. */
  public playing(now: number): boolean {
    return !this.inside && now - this.leftAt >= this.resumeMs;
  }
}
