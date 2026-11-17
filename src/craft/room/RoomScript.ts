import { smoothstep } from "../layers/easing";

/** A stretch of scroll progress, from its start to its end. */
export type Window = Readonly<{ from: number; to: number }>;

/** When the DOM around the scene changes as the reader scrolls through the pinned room. */
export type RoomBeats = Readonly<{
  /** The heading and intro fade and drift up while the camera starts to move. */
  heading: Window;
  /** The pointer's sway of the camera dies away as the screen fills the frame, so the live UI holds still. */
  sway: Window;
  /** At the end, the stage fades to the paper colour as the next section arrives. */
  fade: Window;
}>;

/**
 * What the room's DOM layers show at scroll progress p: how much of the heading is left and how far it has
 * drifted, how strongly the pointer may sway the camera, and how far the stage has faded to paper. Pure.
 */
export class RoomScript {
  public constructor(private readonly beats: RoomBeats) {
    Object.entries(beats).forEach(([name, window]: [string, Window]) => {
      if (!(window.from >= 0 && window.from < window.to && window.to <= 1)) {
        throw new Error(`The ${name} window must be a stretch inside 0…1: ${window.from}…${window.to}`);
      }
    });
  }

  /** The heading's opacity: 1 until it starts to go, 0 once it has. */
  public headingOpacity(p: number): number {
    return 1 - smoothstep(this.beats.heading.from, this.beats.heading.to, p);
  }

  /** How far the heading has drifted up, 0 (in place) to 1 (all the way). */
  public headingRise(p: number): number {
    return smoothstep(this.beats.heading.from, this.beats.heading.to, p);
  }

  /** How strongly the pointer sways the camera, 1 to 0. */
  public sway(p: number): number {
    return 1 - smoothstep(this.beats.sway.from, this.beats.sway.to, p);
  }

  /** How opaque the paper laid over the stage is, 0 to 1. */
  public fade(p: number): number {
    return smoothstep(this.beats.fade.from, this.beats.fade.to, p);
  }
}
