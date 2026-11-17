import { assertNever } from "../layers/assertNever";
import type { HeadingPlacement } from "./RoomShots";

/**
 * How the room plays on this screen:
 * - `pinned`: a wide screen with motion allowed; scroll drives the camera through the room;
 * - `compact`: a phone; a short section with the wide shot, alive but not scroll-driven;
 * - `still`: motion is reduced; the wide shot holds, the live screen still works.
 */
export type RoomMode = Readonly<{ kind: "pinned" }> | Readonly<{ kind: "compact" }> | Readonly<{ kind: "still"; wide: boolean }>;

/** What a mode turns on. */
export type RoomBehaviour = Readonly<{
  /** Scroll progress moves the camera. */
  scroll: boolean;
  /** The cards bob and the lamp wavers. */
  idle: boolean;
  /** The pointer sways the camera. */
  sway: boolean;
  /** Where the heading sits relative to the stage. */
  heading: HeadingPlacement;
  /** The highest device pixel ratio worth rendering at. */
  maxDpr: number;
}>;

/** Picks the mode for a screen: whether it is at least tablet-wide and whether motion is reduced. */
export function pickMode(wide: boolean, reduced: boolean): RoomMode {
  if (reduced) {
    return { kind: "still", wide };
  }
  return wide ? { kind: "pinned" } : { kind: "compact" };
}

/** What `mode` turns on. */
export function behaviourOf(mode: RoomMode): RoomBehaviour {
  switch (mode.kind) {
    case "pinned":
      return { scroll: true, idle: true, sway: true, heading: "over", maxDpr: 2 };
    case "compact":
      return { scroll: false, idle: true, sway: false, heading: "apart", maxDpr: 1.5 };
    case "still":
      return { scroll: false, idle: false, sway: false, heading: mode.wide ? "over" : "apart", maxDpr: mode.wide ? 2 : 1.5 };
    default:
      return assertNever(mode);
  }
}
