import { assertNever } from "../layers/assertNever";

/**
 * How the diorama plays on this screen:
 * - `full`: tablet width and up with motion allowed; it lives, leans toward the pointer and turns under a drag;
 * - `compact`: a phone; it lives and answers taps, but never drags, so it cannot fight the page's scroll;
 * - `still`: motion is reduced; nothing moves by itself, and clicks apply their changes at once.
 */
export type DioramaMode = Readonly<{ kind: "full" }> | Readonly<{ kind: "compact" }> | Readonly<{ kind: "still"; wide: boolean }>;

/** What a mode turns on. */
export type DioramaBehaviour = Readonly<{
  /** The idle life plays: steam, swaying plants, the bobbing duck, the breathing card, the cloud, new tasks. */
  idle: boolean;
  /** The island leans toward the pointer. */
  parallax: boolean;
  /** Dragging turns the island. */
  drag: boolean;
  /** Changes glide and reactions play; otherwise they apply at once. */
  animate: boolean;
  /** The highest device pixel ratio worth rendering at. */
  maxDpr: number;
}>;

/** Picks the mode for a screen: whether it is at least tablet-wide and whether motion is reduced. */
export function pickMode(wide: boolean, reduced: boolean): DioramaMode {
  if (reduced) {
    return { kind: "still", wide };
  }
  return wide ? { kind: "full" } : { kind: "compact" };
}

/** What `mode` turns on. */
export function behaviourOf(mode: DioramaMode): DioramaBehaviour {
  switch (mode.kind) {
    case "full":
      return { idle: true, parallax: true, drag: true, animate: true, maxDpr: 2 };
    case "compact":
      return { idle: true, parallax: false, drag: false, animate: true, maxDpr: 2 };
    case "still":
      return { idle: false, parallax: false, drag: mode.wide, animate: false, maxDpr: 2 };
    default:
      return assertNever(mode);
  }
}
