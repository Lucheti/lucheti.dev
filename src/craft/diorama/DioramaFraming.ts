import type { IsometricView, ScreenBounds } from "../layers/IsometricView";
import { along, point, type Point3 } from "./space";

/** How far the island may turn either way from rest: under a drag and the pointer's lean (yaw), and the lean's tip (tilt). */
export type TurnReach = Readonly<{ yaw: number; tilt: number }>;

/** Where an orthographic camera stands, what it looks at, and its zoom in CSS pixels per island unit. */
export type CameraFit = Readonly<{ zoom: number; target: Point3; position: Point3 }>;

/** The camera stands this far from what it looks at; with an orthographic camera it only has to clear the island. */
const DISTANCE = 30;

/**
 * Frames the island in a fixed orthographic camera: whatever turn the island takes within its reach, every
 * point given stays in the frame, with `margin` (a share of the frame) left free all round. The frame is
 * centred on the island's drawing, not on its origin, so a tall wall never pushes it off centre.
 */
export class DioramaFraming {
  private readonly edges: ScreenBounds;

  public constructor(
    private readonly view: IsometricView,
    points: readonly Point3[],
    reach: TurnReach,
    private readonly free: number,
  ) {
    if (!(free >= 0 && free < 0.5)) {
      throw new Error(`A margin is a share of the frame below a half: ${free}`);
    }
    this.edges = view.bounds(points, reach.yaw, reach.tilt);
  }

  /** The drawing's edges in island units, over every turn within reach. */
  public bounds(): ScreenBounds {
    return this.edges;
  }

  /** The share of the frame left free all round. */
  public margin(): number {
    return this.free;
  }

  /** The camera for a canvas `width` × `height` CSS pixels. */
  public fit(width: number, height: number): CameraFit {
    const spanX = this.edges.maxX - this.edges.minX;
    const spanY = this.edges.maxY - this.edges.minY;
    const room = 1 - 2 * this.free;
    const zoom = width > 0 && height > 0 ? Math.min((width * room) / spanX, (height * room) / spanY) : 1;
    const across = (this.edges.minX + this.edges.maxX) / 2;
    const upward = (this.edges.minY + this.edges.maxY) / 2;
    const target = along(along(point(0, 0, 0), this.view.right(), across), this.view.up(), upward);
    return { zoom, target, position: along(target, this.view.toCamera(), DISTANCE) };
  }
}
