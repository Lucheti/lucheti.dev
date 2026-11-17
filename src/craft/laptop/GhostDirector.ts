import { MAX_FRAME_MS, type FrameScheduler } from "./browser";
import type { Cadence } from "./Cadence";
import type { CommandPalette } from "./CommandPalette";
import type { GhostHands } from "./GhostHands";
import type { GhostPresence } from "./GhostPresence";
import type { GhostFrame, GhostScript, GhostTarget, Point } from "./GhostScript";
import type { TaskBoard } from "./TaskBoard";

/** Where the ghost cursor is drawn: it finds targets on the screen and paints the cursor over them. */
export interface GhostSurface {
  /** Where a target is on the screen now. */
  locate(target: GhostTarget): Point;
  /** Draws the cursor at a frame. */
  paint(frame: GhostFrame): void;
  /** Fades the cursor in or out. */
  show(visible: boolean): void;
}

/**
 * The screen's idle life, on animation frames while the panel is on screen: the ghost cursor plays its loop
 * (yielding to the visitor's pointer and coming back after it leaves) and now and then a new task arrives.
 */
export class GhostDirector {
  private handle: number | null = null;
  private last: number | null = null;
  private elapsed = 0;
  private wasPlaying = false;

  public constructor(
    private readonly script: GhostScript,
    private readonly presence: GhostPresence,
    private readonly hands: GhostHands,
    private readonly arrivals: Cadence,
    private readonly board: TaskBoard,
    private readonly palette: CommandPalette,
    private readonly surface: GhostSurface,
    private readonly frames: FrameScheduler,
  ) {}

  /** Starts the frames; the panel came on screen. */
  public start(): void {
    if (this.handle === null) {
      this.last = null;
      this.handle = this.frames.request(this.tick);
    }
  }

  /** Stops the frames; the panel went off screen or the visitor prefers less motion. The cursor hides. */
  public stop(): void {
    if (this.handle !== null) {
      this.frames.cancel(this.handle);
      this.handle = null;
    }
    if (this.wasPlaying) {
      this.wasPlaying = false;
      this.surface.show(false);
      this.hands.letGo();
    }
  }

  /** The visitor's pointer came into the panel: the ghost steps aside. */
  public enter(): void {
    this.presence.enter();
  }

  /** The visitor's pointer left at `now` (the frames' clock). */
  public leave(now: number): void {
    this.presence.leave(now);
  }

  private readonly tick = (now: number): void => {
    const step = this.last === null ? 0 : Math.min(MAX_FRAME_MS, Math.max(0, now - this.last));
    this.last = now;
    this.play(now, step);
    if (this.arrivals.advance(step) > 0 && !this.palette.opened()) {
      this.board.arrive();
    }
    this.handle = this.frames.request(this.tick);
  };

  private play(now: number, step: number): void {
    const playing = this.presence.playing(now);
    if (!playing) {
      if (this.wasPlaying) {
        this.wasPlaying = false;
        this.surface.show(false);
        this.hands.letGo();
      }
      return;
    }
    if (!this.wasPlaying) {
      this.wasPlaying = true;
      this.elapsed = 0;
      this.hands.tidy();
      this.surface.paint(this.script.frameAt(0, (target) => this.surface.locate(target)));
      this.surface.show(true);
      return;
    }
    const before = this.elapsed;
    this.elapsed += step;
    for (const effect of this.script.effectsBetween(before, this.elapsed)) {
      this.hands.apply(effect);
    }
    this.surface.paint(this.script.frameAt(this.elapsed, (target) => this.surface.locate(target)));
  }
}
