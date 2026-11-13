import type { DepartmentId } from "@/content";
import { Polyline, type Point } from "./Polyline";

/** A card's box in board pixels. */
export type Box = Readonly<{ x: number; y: number; width: number; height: number }>;

/** How far in from a card's right edge the ticket docks on its top border. */
const DOCK_INSET = 44;

/**
 * Where everything sits on the department board, from the measured card boxes.
 *
 * Channels run straight across the gutter between two cards that face each
 * other; the packet only ever travels along hairlines: from the sender's dock
 * around its border to the channel, across, and around the receiver's border
 * to its dock.
 */
export class BoardGeometry {
  public constructor(private readonly boxes: ReadonlyMap<DepartmentId, Box>) {}

  /** The resting point of the ticket on a card: on its top border, near the right. */
  public dock(department: DepartmentId): Point {
    const box = this.boxOf(department);
    return { x: box.x + Math.max(box.width / 2, box.width - DOCK_INSET), y: box.y };
  }

  /** The channel from `from`'s border to `to`'s border, as a path of points. */
  public channel(from: DepartmentId, to: DepartmentId): readonly Point[] {
    return channelBetween(this.boxOf(from), this.boxOf(to));
  }

  /** The packet's full route for one handoff, dock to dock. */
  public leg(from: DepartmentId, to: DepartmentId): Polyline {
    const sender = this.boxOf(from);
    const receiver = this.boxOf(to);
    const start = this.dock(from);
    const end = this.dock(to);
    const across = channelBetween(sender, receiver);
    const points = [
      start,
      ...aroundBorder(sender, start, across[0]),
      ...across.slice(1),
      ...aroundBorder(receiver, across[across.length - 1], end),
    ];
    return new Polyline(withoutRepeats(points));
  }

  private boxOf(department: DepartmentId): Box {
    const box = this.boxes.get(department);
    if (box === undefined) {
      throw new RangeError(`No box measured for "${department}"`);
    }
    return box;
  }
}

/**
 * The shortest hairline between two boxes. Side by side (their vertical
 * extents overlap) or stacked (horizontal extents overlap) it is one straight
 * segment through the middle of the overlap; otherwise an elbow.
 */
export function channelBetween(a: Box, b: Box): readonly Point[] {
  const overlapTop = Math.max(a.y, b.y);
  const overlapBottom = Math.min(a.y + a.height, b.y + b.height);
  const overlapLeft = Math.max(a.x, b.x);
  const overlapRight = Math.min(a.x + a.width, b.x + b.width);
  const aIsLeft = a.x + a.width <= b.x;
  const aIsAbove = a.y + a.height <= b.y;

  if (overlapBottom > overlapTop && (aIsLeft || b.x + b.width <= a.x)) {
    const y = (overlapTop + overlapBottom) / 2;
    return aIsLeft
      ? [{ x: a.x + a.width, y }, { x: b.x, y }]
      : [{ x: a.x, y }, { x: b.x + b.width, y }];
  }
  if (overlapRight > overlapLeft && (aIsAbove || b.y + b.height <= a.y)) {
    const x = (overlapLeft + overlapRight) / 2;
    return aIsAbove
      ? [{ x, y: a.y + a.height }, { x, y: b.y }]
      : [{ x, y: a.y }, { x, y: b.y + b.height }];
  }
  const aMidY = a.y + a.height / 2;
  const bMidX = b.x + b.width / 2;
  const leaveX = b.x >= a.x ? a.x + a.width : a.x;
  const arriveY = b.y >= a.y ? b.y : b.y + b.height;
  return [
    { x: leaveX, y: aMidY },
    { x: bMidX, y: aMidY },
    { x: bMidX, y: arriveY },
  ];
}

/**
 * The corners passed walking the shorter way round `box` from `from` to `to`
 * (both on its border), followed by `to` itself.
 */
export function aroundBorder(box: Box, from: Point, to: Point): readonly Point[] {
  const perimeter = 2 * (box.width + box.height);
  if (perimeter === 0) {
    return [to];
  }
  const start = perimeterOffset(box, from);
  const clockwise = modulo(perimeterOffset(box, to) - start, perimeter);
  const forward = clockwise <= perimeter - clockwise;
  const travel = forward ? clockwise : perimeter - clockwise;
  const corners = cornersOf(box)
    .map((corner) => ({ corner, along: modulo(forward ? corner.offset - start : start - corner.offset, perimeter) }))
    .filter(({ along }) => along > 0 && along < travel)
    .sort((a, b) => a.along - b.along)
    .map(({ corner }) => corner.point);
  return [...corners, to];
}

type Corner = Readonly<{ point: Point; offset: number }>;

/** Corners with their distance clockwise from the top-left one. */
function cornersOf(box: Box): readonly Corner[] {
  const { x, y, width, height } = box;
  return [
    { point: { x, y }, offset: 0 },
    { point: { x: x + width, y }, offset: width },
    { point: { x: x + width, y: y + height }, offset: width + height },
    { point: { x, y: y + height }, offset: 2 * width + height },
  ];
}

/** Clockwise distance from the top-left corner to the border point nearest `point`. */
function perimeterOffset(box: Box, point: Point): number {
  const { x, y, width, height } = box;
  const sides = [
    { gap: Math.abs(point.y - y), offset: clamp(point.x - x, width) },
    { gap: Math.abs(point.x - (x + width)), offset: width + clamp(point.y - y, height) },
    { gap: Math.abs(point.y - (y + height)), offset: width + height + clamp(x + width - point.x, width) },
    { gap: Math.abs(point.x - x), offset: 2 * width + height + clamp(y + height - point.y, height) },
  ];
  const nearest = sides.reduce((best, side) => (side.gap < best.gap ? side : best));
  return nearest.offset;
}

function clamp(value: number, max: number): number {
  return Math.min(max, Math.max(0, value));
}

function modulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function withoutRepeats(points: readonly Point[]): readonly Point[] {
  return points.filter(
    (point, index) => index === 0 || point.x !== points[index - 1].x || point.y !== points[index - 1].y,
  );
}
