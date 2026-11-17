import { cross, dot, minus, point, unit, type Point3 } from "./space";

/** A rectangle of the frame in normalised device coordinates: −1 is the left or bottom edge, 1 the right or top. */
export type FrameRegion = Readonly<{ left: number; right: number; bottom: number; top: number }>;

/** Where a point lands in the frame, and how far in front of the camera it is (negative: behind it). */
export type Projection = { x: number; y: number; depth: number };

/** The world's up. */
const UP = point(0, 1, 0);

/** A camera's three axes: where it looks, its right and its up. Its up is never the world's exactly unless it looks level. */
export type LensAxes = Readonly<{ forward: Point3; right: Point3; up: Point3 }>;

/** The axes of a camera at `position` looking at `target` with the world's up, as three.js's `lookAt` makes them. */
export function lensAxes(position: Point3, target: Point3): LensAxes {
  const forward = unit(minus(target, position));
  const right = unit(cross(forward, UP));
  return { forward, right, up: cross(right, forward) };
}

/**
 * Projects `subject` through a perspective camera at `position` looking at `target`, with a vertical field of
 * view of `fov` degrees and a frame `aspect` wide per unit tall. The same maths three.js's camera does.
 */
export function project(subject: Point3, position: Point3, target: Point3, fov: number, aspect: number, out: Projection): Projection {
  const axes = lensAxes(position, target);
  const offset = minus(subject, position);
  const depth = dot(offset, axes.forward);
  const tanV = Math.tan((fov * Math.PI) / 360);
  out.depth = depth;
  out.x = dot(offset, axes.right) / (depth * tanV * aspect);
  out.y = dot(offset, axes.up) / (depth * tanV);
  return out;
}

/** The eight corners of a box. */
export function corners(min: Point3, max: Point3): readonly Point3[] {
  const result: Point3[] = [];
  for (const x of [min.x, max.x]) {
    for (const y of [min.y, max.y]) {
      for (const z of [min.z, max.z]) {
        result.push(point(x, y, z));
      }
    }
  }
  return result;
}
