/** What fills a shape: one colour, or a soft top-to-bottom gradient. */
export type Paint =
  | Readonly<{ kind: "solid"; color: string }>
  | Readonly<{ kind: "linear"; top: string; bottom: string }>;

type Base = Readonly<{ paint: Paint; opacity: number }>;

/** A circle, in the 160 x 100 picture space. */
export type CircleShape = Base & Readonly<{ kind: "circle"; cx: number; cy: number; r: number }>;
export type EllipseShape = Base & Readonly<{ kind: "ellipse"; cx: number; cy: number; rx: number; ry: number }>;
export type RectShape = Base & Readonly<{ kind: "rect"; x: number; y: number; width: number; height: number; radius: number }>;
export type PolygonShape = Base & Readonly<{ kind: "polygon"; points: readonly Point[] }>;
/** A round-capped stroke, for rain, gulls and waves. */
export type LineShape = Readonly<{ kind: "line"; from: Point; to: Point; width: number; color: string; opacity: number }>;

export type Point = Readonly<{ x: number; y: number }>;

/** Everything a picture is drawn from. */
export type Shape = CircleShape | EllipseShape | RectShape | PolygonShape | LineShape;

/** The picture's own width and height, the space shapes are placed in. */
export const PICTURE_WIDTH = 160;
export const PICTURE_HEIGHT = 100;

/** A finished picture: a sky gradient behind a list of shapes drawn back to front. */
export type Scene = Readonly<{
  sky: Readonly<{ top: string; bottom: string }>;
  shapes: readonly Shape[];
}>;

export function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${String(value)}`);
}

/** Small constructors, so the compositions read as drawings. */
export class Draw {
  public static solid(color: string): Paint {
    return { kind: "solid", color };
  }

  public static fade(top: string, bottom: string): Paint {
    return { kind: "linear", top, bottom };
  }

  public static circle(cx: number, cy: number, r: number, color: string, opacity = 1): Shape {
    return { kind: "circle", cx, cy, r, paint: Draw.solid(color), opacity };
  }

  public static ellipse(cx: number, cy: number, rx: number, ry: number, color: string, opacity = 1): Shape {
    return { kind: "ellipse", cx, cy, rx, ry, paint: Draw.solid(color), opacity };
  }

  public static rect(x: number, y: number, width: number, height: number, paint: Paint | string, opacity = 1, radius = 0): Shape {
    return { kind: "rect", x, y, width, height, radius, paint: typeof paint === "string" ? Draw.solid(paint) : paint, opacity };
  }

  public static polygon(points: readonly (readonly [number, number])[], color: string, opacity = 1): Shape {
    return { kind: "polygon", points: points.map(([x, y]) => ({ x, y })), paint: Draw.solid(color), opacity };
  }

  public static line(x1: number, y1: number, x2: number, y2: number, width: number, color: string, opacity = 1): Shape {
    return { kind: "line", from: { x: x1, y: y1 }, to: { x: x2, y: y2 }, width, color, opacity };
  }

  /** A puffy cloud: a flat base with three round tops. */
  public static cloud(cx: number, cy: number, size: number, color: string, opacity = 1): readonly Shape[] {
    return [
      Draw.ellipse(cx, cy, 11 * size, 3.4 * size, color, opacity),
      Draw.circle(cx - 5 * size, cy - 2.2 * size, 4.2 * size, color, opacity),
      Draw.circle(cx + 0.5 * size, cy - 4.2 * size, 5.4 * size, color, opacity),
      Draw.circle(cx + 6 * size, cy - 1.6 * size, 3.6 * size, color, opacity),
    ];
  }
}

/** A shape and how much the camera moves it: far things (depth near 0) barely react to a zoom. */
export type Part = Readonly<{ shape: Shape; depth: number }>;

/**
 * Frames a composition. Zooming scales everything about a focal point, far layers less than near ones, so a
 * close-up crops into the subject and leaves the sky almost as it was.
 */
export class Camera {
  public constructor(
    private readonly zoom: number,
    private readonly focus: Point,
  ) {
    if (!Number.isFinite(zoom) || zoom < 1) {
      throw new Error(`A camera cannot zoom out below 1, not ${zoom}`);
    }
  }

  /** Places a shape as this camera sees it; `depth` runs from 0 (the sky) to 1 (the subject). */
  public frame(part: Part): Shape {
    const depth = Math.min(1, Math.max(0, part.depth));
    const k = 1 + (this.zoom - 1) * depth;
    const centre: Point = { x: PICTURE_WIDTH / 2, y: PICTURE_HEIGHT / 2 };
    const fx = centre.x + (this.focus.x - centre.x) * depth;
    const fy = centre.y + (this.focus.y - centre.y) * depth;
    const px = (x: number): number => (x - fx) * k + centre.x;
    const py = (y: number): number => (y - fy) * k + centre.y;
    const shape = part.shape;
    switch (shape.kind) {
      case "circle":
        return { ...shape, cx: px(shape.cx), cy: py(shape.cy), r: shape.r * k };
      case "ellipse":
        return { ...shape, cx: px(shape.cx), cy: py(shape.cy), rx: shape.rx * k, ry: shape.ry * k };
      case "rect":
        return {
          ...shape,
          x: px(shape.x),
          y: py(shape.y),
          width: shape.width * k,
          height: shape.height * k,
          radius: shape.radius * k,
        };
      case "polygon":
        return { ...shape, points: shape.points.map((point) => ({ x: px(point.x), y: py(point.y) })) };
      case "line":
        return {
          ...shape,
          from: { x: px(shape.from.x), y: py(shape.from.y) },
          to: { x: px(shape.to.x), y: py(shape.to.y) },
          width: shape.width * k,
        };
      default:
        return assertNever(shape);
    }
  }
}
