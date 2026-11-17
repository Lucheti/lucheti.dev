/** A point on the card's plane: `u` runs across the card (left to right), `v` down it (top to bottom). */
export type CardPoint = Readonly<{ u: number; v: number }>;

/** A closed loop of points on the card's plane. The last point joins back to the first. */
export type Outline = readonly CardPoint[];

/** A box on the card's plane, by its edges. */
export type CardBox = Readonly<{ left: number; top: number; right: number; bottom: number }>;

/** How many straight steps draw a quarter circle: enough to read as round at panel size, few enough to stay cheap. */
const STEPS_PER_QUARTER = 8;

/** The loop of a box with rounded corners; a radius above half the short side is reduced to it (a pill). */
export function roundedBox(box: CardBox, radius: number): Outline {
  const width = box.right - box.left;
  const height = box.bottom - box.top;
  if (!(width > 0) || !(height > 0)) {
    throw new Error(`A box needs a positive size: ${width} × ${height}`);
  }
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  if (r === 0) {
    return [
      { u: box.left, v: box.top },
      { u: box.right, v: box.top },
      { u: box.right, v: box.bottom },
      { u: box.left, v: box.bottom },
    ];
  }
  const corners: readonly Readonly<{ u: number; v: number; from: number }>[] = [
    { u: box.right - r, v: box.top + r, from: -Math.PI / 2 },
    { u: box.right - r, v: box.bottom - r, from: 0 },
    { u: box.left + r, v: box.bottom - r, from: Math.PI / 2 },
    { u: box.left + r, v: box.top + r, from: Math.PI },
  ];
  const points: CardPoint[] = [];
  for (const corner of corners) {
    for (let step = 0; step <= STEPS_PER_QUARTER; step += 1) {
      const angle = corner.from + (step / STEPS_PER_QUARTER) * (Math.PI / 2);
      const point = { u: corner.u + Math.cos(angle) * r, v: corner.v + Math.sin(angle) * r };
      // A pill's corners meet with no straight edge between them; a doubled point would leave a zero-length side.
      if (points.length === 0 || !samePoint(points[points.length - 1], point)) {
        points.push(point);
      }
    }
  }
  return samePoint(points[0], points[points.length - 1]) ? points.slice(0, -1) : points;
}

function samePoint(a: CardPoint, b: CardPoint): boolean {
  return Math.abs(a.u - b.u) < 1e-9 && Math.abs(a.v - b.v) < 1e-9;
}

/** The loop of a circle. */
export function circle(centre: CardPoint, radius: number): Outline {
  if (!(radius > 0)) {
    throw new Error(`A circle needs a positive radius: ${radius}`);
  }
  const steps = STEPS_PER_QUARTER * 4;
  return Array.from({ length: steps }, (_, step) => {
    const angle = (step / steps) * Math.PI * 2;
    return { u: centre.u + Math.cos(angle) * radius, v: centre.v + Math.sin(angle) * radius };
  });
}

/** A box grown (or shrunk, for a negative `by`) on every side. */
export function grow(box: CardBox, by: number): CardBox {
  return { left: box.left - by, top: box.top - by, right: box.right + by, bottom: box.bottom + by };
}

/** A shape drawn in its own units, moved to `at` and scaled by `scale`. */
export function placed(points: readonly (readonly [number, number])[], at: CardPoint, scale: number): Outline {
  return points.map(([u, v]) => ({ u: at.u + u * scale, v: at.v + v * scale }));
}
