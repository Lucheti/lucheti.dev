/** A point or direction on the island, in island units: x toward the open right side, y up, z toward the open front. */
export type Point3 = Readonly<{ x: number; y: number; z: number }>;

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

/** The length of a vector. */
export function length(a: Point3): number {
  return Math.hypot(a.x, a.y, a.z);
}

/** The same direction at length one; a zero vector stays zero. */
export function unit(a: Point3): Point3 {
  const size = length(a);
  return size === 0 ? a : { x: a.x / size, y: a.y / size, z: a.z / size };
}

/** The eight corners of a box. */
export function corners(extent: Extent): readonly Point3[] {
  const result: Point3[] = [];
  for (const x of [extent.min.x, extent.max.x]) {
    for (const y of [extent.min.y, extent.max.y]) {
      for (const z of [extent.min.z, extent.max.z]) {
        result.push(point(x, y, z));
      }
    }
  }
  return result;
}

/** Whether `inner` lies inside `outer`, to within `slack` on every side. */
export function contains(outer: Extent, inner: Extent, slack = 1e-9): boolean {
  return (
    inner.min.x >= outer.min.x - slack &&
    inner.min.y >= outer.min.y - slack &&
    inner.min.z >= outer.min.z - slack &&
    inner.max.x <= outer.max.x + slack &&
    inner.max.y <= outer.max.y + slack &&
    inner.max.z <= outer.max.z + slack
  );
}
