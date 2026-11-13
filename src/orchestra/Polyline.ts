export type Point = Readonly<{ x: number; y: number }>;

/** A point the caller owns and lets `locate` overwrite, so scroll handlers allocate nothing. */
export type PointSlot = { x: number; y: number };

/** A path of straight segments that can be walked by fraction of its length. */
export class Polyline {
  private readonly cumulative: readonly number[];

  public constructor(private readonly points: readonly Point[]) {
    if (points.length === 0) {
      throw new RangeError("A polyline needs at least one point");
    }
    const lengths = [0];
    for (let index = 1; index < points.length; index += 1) {
      lengths.push(lengths[index - 1] + Polyline.distance(points[index - 1], points[index]));
    }
    this.cumulative = lengths;
  }

  private static distance(a: Point, b: Point): number {
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  public length(): number {
    return this.cumulative[this.cumulative.length - 1];
  }

  public vertices(): readonly Point[] {
    return this.points;
  }

  /** Writes the point `fraction` (0 → 1, clamped) of the way along into `out`. */
  public locate(fraction: number, out: PointSlot): void {
    const total = this.length();
    const target = Math.min(1, Math.max(0, fraction)) * total;
    let index = 1;
    while (index < this.points.length - 1 && this.cumulative[index] < target) {
      index += 1;
    }
    const start = this.points[Math.max(0, index - 1)];
    const end = this.points[Math.min(index, this.points.length - 1)];
    const from = this.cumulative[Math.max(0, index - 1)];
    const span = this.cumulative[Math.min(index, this.points.length - 1)] - from;
    const local = span > 0 ? (target - from) / span : 1;
    out.x = start.x + (end.x - start.x) * local;
    out.y = start.y + (end.y - start.y) * local;
  }
}
