import { unionExtent, solidExtent } from "./ClaySolid";
import { CameraPath, type CameraKeyframe } from "./CameraPath";
import { corners, lensAxes, project, type FrameRegion, type Projection } from "./lens";
import type { RoomLayout } from "./RoomLayout";
import { along, orbitDirection, type Extent, type Point3 } from "./space";

/** An orbit round a subject: turned `yaw` from straight on toward the right, lifted `pitch`, both in radians. */
export type Orbit = Readonly<{ yaw: number; pitch: number; fov: number }>;

/** The tuning of the room's three shots and when each is reached. */
export type ShotRules = Readonly<{
  /** The establishing shot, and where it has drifted to by the time the dolly starts. */
  wide: Orbit;
  drift: Orbit;
  /** The shot of the desk the dolly arrives at. */
  approach: Orbit;
  /** The push into the monitor: the field of view, and how much of the frame the screen fills. */
  fill: Readonly<{ fov: number; share: number }>;
  /** Progress at which the drift ends, the approach is reached and the screen fills the frame. */
  beats: Readonly<{ drift: number; approach: number; fill: number }>;
}>;

/** Whether the heading is laid over the stage, so the room keeps clear of it, or sits elsewhere. */
export type HeadingPlacement = "over" | "apart";

/** A camera's place and what it looks at. */
export type Framing = Readonly<{ position: Point3; target: Point3 }>;

/** Wider than this (width per height), the heading sits to the left of the room; narrower, above it. */
const LANDSCAPE = 1.1;
/** How many halvings the distance search takes: far more precision than a frame can show. */
const SEARCH_STEPS = 48;
const NEAREST = 0.5;
const FARTHEST = 200;
/** The desk shot leaves a margin round the desk, so the cards beside it stay in view as they open. */
const APPROACH_REGION: FrameRegion = { left: -0.64, right: 0.64, bottom: -0.6, top: 0.62 };

/**
 * The room's camera shots for a stage of a given shape: a wide establishing shot that fits the whole room in
 * the part of the frame the heading leaves free, a closer shot of the desk, and a straight-on push into the
 * monitor until its screen fills the frame. Owns the framing maths; `path` strings the shots into a
 * `CameraPath`.
 */
export class RoomShots {
  private readonly room: Extent;
  private readonly workspace: Extent;

  public constructor(
    private readonly layout: RoomLayout,
    private readonly rules: ShotRules,
  ) {
    const { drift, approach, fill } = rules.beats;
    if (!(drift > 0 && drift < approach && approach < fill && fill < 1)) {
      throw new Error(`The beats must fall in order inside 0…1: ${drift}, ${approach}, ${fill}`);
    }
    if (!(rules.fill.share > 0 && rules.fill.share <= 1)) {
      throw new Error(`The screen fills a share of the frame above 0 and at most 1: ${rules.fill.share}`);
    }
    this.room = layout.extent();
    const deskTop = layout.part("desk").filter((solid) => solid.tone === "wood");
    this.workspace = unionExtent(
      [...deskTop, ...(["monitor", "keyboard", "lamp", "plant", "mug"] as const).flatMap((part) => layout.part(part))].map(solidExtent),
    );
  }

  /** The part of the frame the room is fitted into, for a stage `aspect` wide per unit tall. */
  public static region(aspect: number, heading: HeadingPlacement): FrameRegion {
    if (heading === "apart") {
      return { left: -0.94, right: 0.94, bottom: -0.9, top: 0.9 };
    }
    return aspect >= LANDSCAPE
      ? { left: -0.06, right: 0.95, bottom: -0.86, top: 0.8 }
      : { left: -0.92, right: 0.92, bottom: -0.94, top: 0.18 };
  }

  /** The whole camera move for a stage of this shape. */
  public path(aspect: number, heading: HeadingPlacement): CameraPath {
    const { rules } = this;
    const region = RoomShots.region(aspect, heading);
    const wide = this.wide(rules.wide, aspect, region);
    const drift = this.wide(rules.drift, aspect, region);
    const approach = RoomShots.fit(this.workspace, this.layout.deskFocus(), rules.approach, aspect, APPROACH_REGION);
    const fill = this.fill(aspect);
    const frames: CameraKeyframe[] = [
      { at: 0, ...wide, fov: rules.wide.fov, pace: "steady" },
      { at: rules.beats.drift, ...drift, fov: rules.drift.fov, pace: "steady" },
      { at: rules.beats.approach, ...approach, fov: rules.approach.fov, pace: "glide" },
      { at: rules.beats.fill, ...fill, fov: rules.fill.fov, pace: "glide" },
      { at: 1, ...fill, fov: rules.fill.fov, pace: "steady" },
    ];
    return new CameraPath(frames);
  }

  /** The establishing shot: the whole room, fitted into `region`. */
  public wide(orbit: Orbit, aspect: number, region: FrameRegion): Framing {
    const { min, max } = this.room;
    const centre = { x: (min.x + max.x) / 2, y: (min.y + max.y) / 2, z: (min.z + max.z) / 2 };
    return RoomShots.fit(this.room, centre, orbit, aspect, region);
  }

  /** Straight on to the screen, back just far enough that it fills its share of the frame. */
  public fill(aspect: number): Framing {
    const screen = this.layout.screen();
    const tanV = Math.tan((this.rules.fill.fov * Math.PI) / 360);
    const share = this.rules.fill.share;
    const distance = Math.max(screen.height / 2 / (share * tanV), screen.width / 2 / (share * tanV * aspect));
    return { position: along(screen.centre, screen.normal, distance), target: screen.centre };
  }

  /**
   * Fits `extent` into `region`: the camera orbits `focus` at `orbit`, as close as it can while the box's
   * projected corners still fit the region's width and height, then slides sideways (keeping its direction) so
   * they are centred in it.
   */
  private static fit(extent: Extent, focus: Point3, orbit: Orbit, aspect: number, region: FrameRegion): Framing {
    const away = orbitDirection(orbit.yaw, orbit.pitch);
    const points = corners(extent.min, extent.max);
    const width = region.right - region.left;
    const height = region.top - region.bottom;
    const scratch: Projection = { x: 0, y: 0, depth: 0 };
    const spread = (distance: number): Readonly<{ minX: number; maxX: number; minY: number; maxY: number }> => {
      const position = along(focus, away, distance);
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const corner of points) {
        project(corner, position, focus, orbit.fov, aspect, scratch);
        if (!(scratch.depth > 0)) {
          return { minX: -Infinity, maxX: Infinity, minY: -Infinity, maxY: Infinity };
        }
        minX = Math.min(minX, scratch.x);
        maxX = Math.max(maxX, scratch.x);
        minY = Math.min(minY, scratch.y);
        maxY = Math.max(maxY, scratch.y);
      }
      return { minX, maxX, minY, maxY };
    };
    const fits = (distance: number): boolean => {
      const box = spread(distance);
      return box.maxX - box.minX <= width && box.maxY - box.minY <= height;
    };
    let near = NEAREST;
    let far = FARTHEST;
    for (let step = 0; step < SEARCH_STEPS; step += 1) {
      const middle = (near + far) / 2;
      if (fits(middle)) {
        far = middle;
      } else {
        near = middle;
      }
    }
    const box = spread(far);
    const position = along(focus, away, far);
    const axes = lensAxes(position, focus);
    const tanV = Math.tan((orbit.fov * Math.PI) / 360);
    // Sliding the camera by s moves a subject at depth d across the frame by s / (d · tan): use the focus's depth.
    const slideX = -(((region.left + region.right) / 2 - (box.minX + box.maxX) / 2) * far * tanV * aspect);
    const slideY = -(((region.bottom + region.top) / 2 - (box.minY + box.maxY) / 2) * far * tanV);
    const slide = (p: Point3): Point3 => along(along(p, axes.right, slideX), axes.up, slideY);
    return { position: slide(position), target: slide(focus) };
  }
}
