import { ball, drum, offset } from "./shapes";
import type { Solid } from "./Solid";
import { point, type Extent, type Point3 } from "./space";

/** The pointer's target on an island: only the big button's hit box answers, under this name. */
export const BUTTON_TARGET = "button";

/** A group of solids that moves as one, about its pivot. The solids are placed in island space. */
export type Piece = Readonly<{ pivot: Point3; solids: readonly Solid[] }>;

/** A big button: its fixed housing, its cap (pivot at the cap's foot), how far it goes in, and its hit box. */
export type ButtonRig = Readonly<{ housing: readonly Solid[]; cap: Piece; travel: number; hit: Extent }>;

/**
 * The big orange arcade button on its pedestal, standing at `at` on the ground: an ink pedestal, a cream
 * bezel, and a fat signal-orange cap that the poser pushes in. Every island's button is this one.
 */
export function arcadeButton(at: Point3): ButtonRig {
  const part = "control";
  const housing: Solid[] = [
    drum(part, "ink", offset(at, 0, 0.05, 0), 0.7, 0.74, 0.1),
    drum(part, "ink", offset(at, 0, 0.32, 0), 0.5, 0.6, 0.48),
    drum(part, "cream", offset(at, 0, 0.62, 0), 0.74, 0.76, 0.16),
    drum(part, "trim", offset(at, 0, 0.71, 0), 0.62, 0.66, 0.04),
  ];
  const foot = offset(at, 0, 0.69, 0);
  const cap: Piece = {
    pivot: foot,
    solids: [drum(part, "signal", offset(foot, 0, 0.1, 0), 0.56, 0.56, 0.2), ball(part, "signal", offset(foot, 0, 0.19, 0), 0.56, point(1, 0.4, 1))],
  };
  return {
    housing,
    cap,
    travel: 0.17,
    hit: { min: offset(at, -0.8, 0, -0.8), max: offset(at, 0.8, 1.2, 0.8) },
  };
}
