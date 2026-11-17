import { assertNever } from "../layers/assertNever";
import type { IsometricView, ScreenBounds, Vec2 } from "../layers/IsometricView";
import type { ClaySolid, ClayTone, RoomPart } from "./ClaySolid";
import type { RoomLayout } from "./RoomLayout";
import { dot, point, type Point3 } from "./space";

/** Which side of a box a face is: its top, the side facing the viewer's left (+z) or right (+x). */
export type FaceSide = "top" | "left" | "right";

/** One flat face of the drawing, in screen units with y up. */
export type SketchFace = Readonly<{ tone: ClayTone; side: FaceSide; points: readonly Vec2[] }>;

/**
 * The order the drawn parts are painted in: the ground, the walls and what hangs on them, then the furniture
 * from the floor up. A part's blocks are painted back to front among themselves.
 */
const DRAW_ORDER: readonly RoomPart[] = ["plinth", "rug", "wall", "pegboard", "tile", "shelf", "poster", "drawers", "chair", "desk", "monitor", "keyboard"];
/** Too small to read in a drawing. */
const SKIPPED: readonly RoomPart[] = ["keyboard", "mouse", "pegboard"];
/** Except the large piece of each: the keyboard's body and the board itself. */
const KEPT: readonly string[] = ["keyboard:metal", "pegboard:board"];

/**
 * The fallback drawing of the room: its square blocks as flat isometric faces, back to front, so it can be
 * drawn as SVG while WebGL loads or if it never does. Only blocks the eye needs (the shell, the desk, the
 * monitor, the shelf, the poster, the board and its tiles), never the small round props.
 */
export class RoomSketch {
  private readonly all: readonly SketchFace[];
  private readonly edges: ScreenBounds;

  public constructor(layout: RoomLayout, view: IsometricView) {
    const blocks = layout
      .solids()
      .filter((solid): solid is Extract<ClaySolid, { kind: "block" }> => solid.kind === "block" && solid.turn === undefined)
      .filter((solid) => DRAW_ORDER.includes(solid.part))
      .filter((solid) => !SKIPPED.includes(solid.part) || KEPT.includes(`${solid.part}:${solid.tone}`));
    const back = view.toCamera();
    const ordered = [...blocks].sort((a, b) => RoomSketch.rank(a, back) - RoomSketch.rank(b, back));
    const out: Vec2 = { x: 0, y: 0 };
    const flat = (corner: Point3): Vec2 => {
      view.project(corner, 0, 0, out);
      return { x: out.x, y: out.y };
    };
    this.all = ordered.flatMap((solid) =>
      (["top", "left", "right"] as const).map((side) => ({
        tone: solid.tone,
        side,
        points: RoomSketch.face(solid, side).map(flat),
      })),
    );
    const xs = this.all.flatMap((face) => face.points.map((p) => p.x));
    const ys = this.all.flatMap((face) => face.points.map((p) => p.y));
    this.edges = { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
  }

  /** The faces, in drawing order. */
  public faces(): readonly SketchFace[] {
    return this.all;
  }

  /** The drawing's edges. */
  public bounds(): ScreenBounds {
    return this.edges;
  }

  /** By part in drawing order, then back to front by the block's centre. Parts outside the order are not drawn. */
  private static rank(solid: Extract<ClaySolid, { kind: "block" }>, back: Point3): number {
    return DRAW_ORDER.indexOf(solid.part) * 1000 + dot(solid.at, back);
  }

  /** The four corners of one visible face of a block, in winding order. */
  private static face(solid: Extract<ClaySolid, { kind: "block" }>, side: FaceSide): readonly Point3[] {
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
