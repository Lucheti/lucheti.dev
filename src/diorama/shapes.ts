import type { Part, Solid, Tone, Turn } from "./Solid";
import { point, type Point3 } from "./space";

/** Small makers for the toolkit's solids, so a layout reads as a list of things rather than of fields. */

/** A rounded box centred on `at`. */
export function block(part: Part, tone: Tone, at: Point3, size: Point3, radius: number, turn?: Turn): Solid {
  return turn === undefined ? { kind: "block", part, tone, at, size, radius } : { kind: "block", part, tone, at, size, radius, turn };
}

/** A flat slab with rounded corners in plan, centred on `at`; `size.y` is its thickness. */
export function pad(part: Part, tone: Tone, at: Point3, size: Point3, corner: number): Solid {
  return { kind: "pad", part, tone, at, size, corner };
}

/** An upright cylinder or cone centred on `at`, or laid along another axis by `turn`. */
export function drum(part: Part, tone: Tone, at: Point3, top: number, bottom: number, height: number, turn?: Turn): Solid {
  return turn === undefined
    ? { kind: "drum", part, tone, at, top, bottom, height }
    : { kind: "drum", part, tone, at, top, bottom, height, turn };
}

/** A sphere, or an ellipsoid stretched along its axes. */
export function ball(part: Part, tone: Tone, at: Point3, radius: number, stretch?: Point3): Solid {
  return stretch === undefined ? { kind: "ball", part, tone, at, radius } : { kind: "ball", part, tone, at, radius, stretch };
}

/** A capsule between two points. */
export function rod(part: Part, tone: Tone, from: Point3, to: Point3, radius: number): Solid {
  return { kind: "rod", part, tone, from, to, radius };
}

/** A torus round its own z axis, turned into place. */
export function torus(part: Part, tone: Tone, at: Point3, radius: number, tube: number, turn: Turn): Solid {
  return { kind: "ring", part, tone, at, radius, tube, arc: Math.PI * 2, turn };
}

/** `at` moved by (`x`, `y`, `z`). */
export function offset(at: Point3, x: number, y: number, z: number): Point3 {
  return point(at.x + x, at.y + y, at.z + z);
}

/** The point `share` of the way from `a` to `b`. */
export function lerp(a: Point3, b: Point3, share: number): Point3 {
  return point(a.x + (b.x - a.x) * share, a.y + (b.y - a.y) * share, a.z + (b.z - a.z) * share);
}

/** A point on a hop from `a` to `b` that rises `height` above the higher end at its middle. */
export function arc(a: Point3, b: Point3, height: number, share: number): Point3 {
  const flat = lerp(a, b, share);
  const top = Math.max(a.y, b.y) + height;
  // A quadratic Bézier through a raised middle control point: the control sits so the peak reaches `top`.
  const control = 2 * top - (a.y + b.y) / 2;
  const s = share;
  const y = (1 - s) * (1 - s) * a.y + 2 * (1 - s) * s * control + s * s * b.y;
  return point(flat.x, y, flat.z);
}
