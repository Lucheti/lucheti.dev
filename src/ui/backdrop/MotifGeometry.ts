import type { DrawingPoint } from "../illustrations";

/** A cubic bezier in a motif's own coordinates. */
export type Cubic = Readonly<{ from: DrawingPoint; c1: DrawingPoint; c2: DrawingPoint; to: DrawingPoint }>;

/** A straight link between two points. */
export type Segment = Readonly<{ from: DrawingPoint; to: DrawingPoint }>;

/** Rounds to one decimal, so path strings stay short and identical on server and client. */
function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function point(x: number, y: number): DrawingPoint {
  return { x: round(x), y: round(y) };
}

/** The point at `t` (0–1) along a cubic bezier. */
export function pointOnCubic(curve: Cubic, t: number): DrawingPoint {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return point(
    a * curve.from.x + b * curve.c1.x + c * curve.c2.x + d * curve.to.x,
    a * curve.from.y + b * curve.c1.y + c * curve.c2.y + d * curve.to.y,
  );
}

/** The SVG path data of a cubic bezier. */
export function cubicPath(curve: Cubic): string {
  const { from, c1, c2, to } = curve;
  return `M${from.x} ${from.y} C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${to.x} ${to.y}`;
}

/** The SVG path data of a straight segment. */
export function segmentPath(segment: Segment): string {
  return `M${segment.from.x} ${segment.from.y} L${segment.to.x} ${segment.to.y}`;
}

/** The middle of a segment. */
export function midpointOf(segment: Segment): DrawingPoint {
  return point((segment.from.x + segment.to.x) / 2, (segment.from.y + segment.to.y) / 2);
}

/** The segment from `from` to `to`, shortened by `inset` at both ends so a link stops at the edge of its nodes. */
export function insetSegment(from: DrawingPoint, to: DrawingPoint, inset: number): Segment {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length <= inset * 2) {
    const middle = midpointOf({ from, to });
    return { from: middle, to: middle };
  }
  const ux = dx / length;
  const uy = dy / length;
  return {
    from: point(from.x + ux * inset, from.y + uy * inset),
    to: point(to.x - ux * inset, to.y - uy * inset),
  };
}

/**
 * The strands of the AI motif: `count` curves that cross a `width` × `height`
 * field left to right, spread wide at the edges and pinched together in the
 * middle like a lens. Each strand wavers a little, deterministically.
 */
export function strandField(count: number, width: number, height: number): readonly Cubic[] {
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError("A strand field needs at least one strand");
  }
  const middle = height / 2;
  return Array.from({ length: count }, (_, index) => {
    const spread = count === 1 ? 0 : index / (count - 1) - 0.5;
    return {
      from: point(-width * 0.04, middle + spread * height + 14 * Math.sin(index * 1.9)),
      c1: point(width * 0.3, middle + spread * height * 0.3 + 24 * Math.sin(index * 1.3 + 0.4)),
      c2: point(width * 0.6, middle + spread * height * 0.18 - 20 * Math.cos(index * 1.7)),
      to: point(width * 1.04, middle + spread * height * 0.85 + 18 * Math.cos(index * 0.9)),
    };
  });
}
