import { assertNever } from "../layers/assertNever";
import { minus, point, type Extent, type Point3 } from "./space";

/** The clay colours the room is modelled in. `signal` is the one accent. */
export type ClayTone =
  | "plaster"
  | "floor"
  | "rug"
  | "white"
  | "paper"
  | "stone"
  | "wood"
  | "ink"
  | "metal"
  | "signal"
  | "leaf"
  | "board"
  | "bulb";

/** Which prop a solid belongs to, so tests and the fallback drawing can find the parts they care about. */
export type RoomPart =
  | "plinth"
  | "wall"
  | "rug"
  | "desk"
  | "drawers"
  | "monitor"
  | "keyboard"
  | "mouse"
  | "mug"
  | "plant"
  | "fig"
  | "lamp"
  | "chair"
  | "pegboard"
  | "tile"
  | "shelf"
  | "poster";

/** Euler angles in radians, applied x then y then z, as three.js does by default. */
export type Turn = Point3;

/**
 * One piece of clay. Every shape is placed by its centre, except a rod, which runs between two points.
 */
export type ClaySolid =
  /** A box with rounded edges. */
  | Readonly<{ kind: "block"; part: RoomPart; tone: ClayTone; at: Point3; size: Point3; radius: number; turn?: Turn }>
  /** A cylinder or truncated cone, standing along its own y axis. */
  | Readonly<{ kind: "drum"; part: RoomPart; tone: ClayTone; at: Point3; top: number; bottom: number; height: number; turn?: Turn }>
  /** A sphere, optionally stretched into an ellipsoid along its own axes. */
  | Readonly<{ kind: "ball"; part: RoomPart; tone: ClayTone; at: Point3; radius: number; stretch?: Point3; turn?: Turn }>
  /** A capsule from one point to another. */
  | Readonly<{ kind: "rod"; part: RoomPart; tone: ClayTone; from: Point3; to: Point3; radius: number }>
  /** A torus round its own z axis; `arc` below 2π leaves it open. */
  | Readonly<{ kind: "ring"; part: RoomPart; tone: ClayTone; at: Point3; radius: number; tube: number; arc: number; turn?: Turn }>
  /** A five-pointed star extruded along its own z axis. */
  | Readonly<{ kind: "star"; part: RoomPart; tone: ClayTone; at: Point3; outer: number; inner: number; depth: number; turn?: Turn }>;

const NO_TURN: Turn = { x: 0, y: 0, z: 0 };

/** `v` turned by `turn` the way three.js turns an object with an XYZ Euler: about z, then y, then x. */
export function turnVector(turn: Turn, v: Point3): Point3 {
  const cz = Math.cos(turn.z);
  const sz = Math.sin(turn.z);
  const x1 = v.x * cz - v.y * sz;
  const y1 = v.x * sz + v.y * cz;
  const cy = Math.cos(turn.y);
  const sy = Math.sin(turn.y);
  const x2 = x1 * cy + v.z * sy;
  const z2 = -x1 * sy + v.z * cy;
  const cx = Math.cos(turn.x);
  const sx = Math.sin(turn.x);
  return point(x2, y1 * cx - z2 * sx, y1 * sx + z2 * cx);
}

/** A box round `at` reaching `half` either side on each axis. */
function around(at: Point3, half: Point3): Extent {
  return { min: minus(at, half), max: point(at.x + half.x, at.y + half.y, at.z + half.z) };
}

/** A cube round `at` that holds a sphere of `radius`. */
function ballExtent(at: Point3, radius: number): Extent {
  return around(at, point(radius, radius, radius));
}

/** The reach along each world axis of a turned box with half-sizes `half`: the sum of its turned half-axes' shadows. */
function boxReach(turn: Turn, half: Point3): Point3 {
  const ax = turnVector(turn, point(half.x, 0, 0));
  const ay = turnVector(turn, point(0, half.y, 0));
  const az = turnVector(turn, point(0, 0, half.z));
  return point(
    Math.abs(ax.x) + Math.abs(ay.x) + Math.abs(az.x),
    Math.abs(ax.y) + Math.abs(ay.y) + Math.abs(az.y),
    Math.abs(ax.z) + Math.abs(ay.z) + Math.abs(az.z),
  );
}

/** The reach along each world axis of a turned cylinder: its axis's shadow plus its round end's. */
function drumReach(turn: Turn, radius: number, halfHeight: number): Point3 {
  const axis = turnVector(turn, point(0, 1, 0));
  const reach = (component: number): number => Math.abs(component) * halfHeight + radius * Math.sqrt(Math.max(0, 1 - component * component));
  return point(reach(axis.x), reach(axis.y), reach(axis.z));
}

/** The reach along each world axis of a turned ellipsoid with semi-axes `half`. */
function ellipsoidReach(turn: Turn, half: Point3): Point3 {
  const ax = turnVector(turn, point(half.x, 0, 0));
  const ay = turnVector(turn, point(0, half.y, 0));
  const az = turnVector(turn, point(0, 0, half.z));
  return point(Math.hypot(ax.x, ay.x, az.x), Math.hypot(ax.y, ay.y, az.y), Math.hypot(ax.z, ay.z, az.z));
}

/** The axis-aligned box a solid fits in: exact for blocks, drums, balls and rods, a sphere's box for rings and stars. */
export function solidExtent(solid: ClaySolid): Extent {
  switch (solid.kind) {
    case "block":
      return around(solid.at, boxReach(solid.turn ?? NO_TURN, point(solid.size.x / 2, solid.size.y / 2, solid.size.z / 2)));
    case "drum":
      return around(solid.at, drumReach(solid.turn ?? NO_TURN, Math.max(solid.top, solid.bottom), solid.height / 2));
    case "ball": {
      const stretch = solid.stretch ?? point(1, 1, 1);
      const half = point(solid.radius * stretch.x, solid.radius * stretch.y, solid.radius * stretch.z);
      return around(solid.at, ellipsoidReach(solid.turn ?? NO_TURN, half));
    }
    case "rod": {
      const r = solid.radius;
      return {
        min: point(Math.min(solid.from.x, solid.to.x) - r, Math.min(solid.from.y, solid.to.y) - r, Math.min(solid.from.z, solid.to.z) - r),
        max: point(Math.max(solid.from.x, solid.to.x) + r, Math.max(solid.from.y, solid.to.y) + r, Math.max(solid.from.z, solid.to.z) + r),
      };
    }
    case "ring":
      return ballExtent(solid.at, solid.radius + solid.tube);
    case "star":
      return ballExtent(solid.at, Math.hypot(solid.outer, solid.depth / 2));
    default:
      return assertNever(solid);
  }
}

/** The smallest box holding every extent. */
export function unionExtent(extents: readonly Extent[]): Extent {
  if (extents.length === 0) {
    throw new Error("A union needs at least one extent");
  }
  let min = extents[0].min;
  let max = extents[0].max;
  for (const extent of extents) {
    min = point(Math.min(min.x, extent.min.x), Math.min(min.y, extent.min.y), Math.min(min.z, extent.min.z));
    max = point(Math.max(max.x, extent.max.x), Math.max(max.y, extent.max.y), Math.max(max.z, extent.max.z));
  }
  return { min, max };
}
