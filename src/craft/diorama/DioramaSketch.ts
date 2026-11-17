import { assertNever } from "../layers/assertNever";
import type { IsometricView, ScreenBounds, Vec2 } from "../layers/IsometricView";
import type { DioramaLayout } from "./DioramaLayout";
import type { Part, Solid, Tone } from "./Solid";
import { dot, point, type Point3 } from "./space";

/** Which side of a box a face is: its top, the side facing the viewer's left (+z) or right (+x). */
export type FaceSide = "top" | "left" | "right";

/** One flat face of the drawing, in screen units with y up. */
export type SketchFace = Readonly<{ tone: Tone; side: FaceSide; points: readonly Vec2[] }>;

type Boxy = Extract<Solid, { kind: "block" | "pad" }>;

/**
 * The order the drawn parts are painted in: the plinth and floor, the walls and what hangs on them, then
 * the furniture from the floor up. A part's boxes are painted back to front among themselves.
 */
const DRAW_ORDER: readonly Part[] = [
  "plinth",
  "floor",
  "wall",
  "trim",
  "window",
  "shelf",
  "print",
  "pegboard",
  "control",
  "rug",
  "drawers",
  "desk",
  "monitor",
  "keyboard",
];

/** Boxes smaller than this on every side are too small to read in a drawing. */
const TINY = 0.09;

/**
 * The fallback drawing of the island: its square pieces as flat faces seen from the camera's angle, back to
 * front, so it can be drawn as SVG while WebGL loads or if it never does. Only boxes the eye needs, never the
 * small round props.
 */
export class DioramaSketch {
  private readonly all: readonly SketchFace[];
  private readonly edges: ScreenBounds;
  private readonly ground: readonly Vec2[];

  public constructor(layout: DioramaLayout, view: IsometricView) {
    const boxes = layout
      .solids()
      .filter((solid): solid is Boxy => (solid.kind === "block" || solid.kind === "pad") && solid.turn === undefined)
      .filter((solid) => DRAW_ORDER.includes(solid.part))
      .filter((solid) => Math.max(solid.size.x, solid.size.y, solid.size.z) >= TINY);
    const back = view.toCamera();
    const ordered = [...boxes].sort((a, b) => DioramaSketch.rank(a, back) - DioramaSketch.rank(b, back));
    const out: Vec2 = { x: 0, y: 0 };
    const flat = (corner: Point3): Vec2 => {
      view.project(corner, 0, 0, out);
      return { x: out.x, y: out.y };
    };
    this.all = ordered.flatMap((solid) =>
      (["top", "left", "right"] as const).map((side) => ({ tone: solid.tone, side, points: DioramaSketch.face(solid, side).map(flat) })),
    );
    const xs = this.all.flatMap((face) => face.points.map((p) => p.x));
    const ys = this.all.flatMap((face) => face.points.map((p) => p.y));
    this.edges = { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
    const half = layout.half();
    const bottom = layout.bottom();
    this.ground = [point(-half, bottom, -half), point(half, bottom, -half), point(half, bottom, half), point(-half, bottom, half)].map(flat);
  }

  /** The plinth's underside as a quad, in drawing order, where the island's shadow lies. */
  public footprint(): readonly Vec2[] {
    return this.ground;
  }

  /** The faces, in drawing order. */
  public faces(): readonly SketchFace[] {
    return this.all;
  }

  /** The drawing's edges. */
  public bounds(): ScreenBounds {
    return this.edges;
  }

  /** By part in drawing order, then back to front by the box's centre. */
  private static rank(solid: Boxy, back: Point3): number {
    return DRAW_ORDER.indexOf(solid.part) * 1000 + dot(solid.at, back);
  }

  /** The four corners of one visible face of a box, in winding order. */
  private static face(solid: Boxy, side: FaceSide): readonly Point3[] {
    const { at, size } = solid;
    const x0 = at.x - size.x / 2;
    const x1 = at.x + size.x / 2;
    const y0 = at.y - size.y / 2;
    const y1 = at.y + size.y / 2;
    const z0 = at.z - size.z / 2;
    const z1 = at.z + size.z / 2;
    switch (side) {
      case "top":
        return [point(x0, y1, z0), point(x1, y1, z0), point(x1, y1, z1), point(x0, y1, z1)];
      case "left":
        return [point(x0, y1, z1), point(x1, y1, z1), point(x1, y0, z1), point(x0, y0, z1)];
      case "right":
        return [point(x1, y1, z1), point(x1, y1, z0), point(x1, y0, z0), point(x1, y0, z1)];
      default:
        return assertNever(side);
    }
  }
}
