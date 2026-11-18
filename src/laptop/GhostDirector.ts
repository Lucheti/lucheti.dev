import type { FrameListener } from "./FrameLoop";
import type { GhostPresence } from "./GhostPresence";
import type { GhostFrame, GhostScript, Point } from "./GhostScript";

/** Where the ghost cursor is drawn: it finds targets on the screen and paints the cursor over them. */
export interface GhostSurface<T> {
  /** Where a target is on the screen now. */
  locate(target: T): Point;
  /** Draws the cursor at a frame. */
  paint(frame: GhostFrame<T>): void;
  /** Fades the cursor in or out. */
  show(visible: boolean): void;
}

/** Turns the ghost's clicks and key presses into the same actions a visitor's would take. */
export interface GhostHands<E> {
  /** Applies one click or key press. */
  apply(effect: E): void;
  /** The ghost is about to start its loop: the app goes back to where the loop expects it. */
  tidy(): void;
  /** The visitor took over, or the panel left the screen: anything the ghost left half-done is put away. */
  letGo(): void;
}

/**
 * The ghost cursor, frame by frame: it plays its loop, yields the moment the visitor's pointer comes in and
 * comes back a while after it leaves, starting its loop afresh each time.
 */
export class GhostDirector<T, E> implements FrameListener {
  private elapsed = 0;
  private wasPlaying = false;

  public constructor(
    private readonly script: GhostScript<T, E>,
    private readonly presence: GhostPresence,
    private readonly hands: GhostHands<E>,
    private readonly surface: GhostSurface<T>,
  ) {}

  /** The visitor's pointer came into the panel: the ghost steps aside. */
  public enter(): void {
    this.presence.enter();
  }

  /** The visitor's pointer left at `now` (the frames' clock). */
  public leave(now: number): void {
    this.presence.leave(now);
  }

  public frame(now: number, step: number): void {
    const playing = this.presence.playing(now);
    if (!playing) {
      this.halt();
      return;
    }
    if (!this.wasPlaying) {
      this.wasPlaying = true;
      this.elapsed = 0;
      this.hands.tidy();
      this.surface.paint(this.script.frameAt(0, this.locate));
      this.surface.show(true);
      return;
    }
    const before = this.elapsed;
    this.elapsed += step;
    for (const effect of this.script.effectsBetween(before, this.elapsed)) {
      this.hands.apply(effect);
    }
    this.surface.paint(this.script.frameAt(this.elapsed, this.locate));
  }

  public halt(): void {
    if (this.wasPlaying) {
      this.wasPlaying = false;
      this.surface.show(false);
      this.hands.letGo();
    }
  }

  private readonly locate = (target: T): Point => this.surface.locate(target);
}
