/** A point or direction in the room, in metres: x to the right wall, y up, z out of the back wall. */
export type Point3 = Readonly<{ x: number; y: number; z: number }>;

/** A writable point, so a frame can reuse one instead of allocating. */
export type MutablePoint3 = { x: number; y: number; z: number };

/** An axis-aligned box: its least and greatest corners. */
export type Extent = Readonly<{ min: Point3; max: Point3 }>;

/** A point from its three coordinates. */
export function point(x: number, y: number, z: number): Point3 {
  return { x, y, z };
}

/** `a + b × scale`. */
export function along(a: Point3, b: Point3, scale: number): Point3 {
  return { x: a.x + b.x * scale, y: a.y + b.y * scale, z: a.z + b.z * scale };
}

/** `a − b`. */
export function minus(a: Point3, b: Point3): Point3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

/** The dot product. */
export function dot(a: Point3, b: Point3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/** The cross product. */
export function cross(a: Point3, b: Point3): Point3 {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}

/** The length of a vector. */
export function length(a: Point3): number {
  return Math.hypot(a.x, a.y, a.z);
}

/** The same direction at length one; a zero vector stays zero. */
export function unit(a: Point3): Point3 {
  const size = length(a);
  return size === 0 ? a : { x: a.x / size, y: a.y / size, z: a.z / size };
}

/** Whether two points are the same to within a micrometre. */
export function samePoint(a: Point3, b: Point3): boolean {
  return Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6 && Math.abs(a.z - b.z) < 1e-6;
}

/**
 * The unit direction from a subject to a camera orbiting it: `yaw` turns from straight in front (+z) toward
 * the right (+x), `pitch` lifts above the horizon. Both in radians.
 */
export function orbitDirection(yaw: number, pitch: number): Point3 {
  const flat = Math.cos(pitch);
  return { x: Math.sin(yaw) * flat, y: Math.sin(pitch), z: Math.cos(yaw) * flat };
}
