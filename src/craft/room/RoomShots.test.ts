import { describe, expect, it } from "vitest";
import { blankPose } from "./CameraPath";
import { corners, project, type FrameRegion, type Projection } from "./lens";
import { RoomLayout } from "./RoomLayout";
import { RoomShots, type HeadingPlacement, type ShotRules } from "./RoomShots";

const DEGREE = Math.PI / 180;
const RULES: ShotRules = {
  wide: { yaw: 45 * DEGREE, pitch: 30 * DEGREE, fov: 22 },
  drift: { yaw: 41 * DEGREE, pitch: 28.5 * DEGREE, fov: 22 },
  approach: { yaw: 22 * DEGREE, pitch: 14 * DEGREE, fov: 28 },
  fill: { fov: 30, share: 0.9 },
  beats: { drift: 0.24, approach: 0.58, fill: 0.86 },
};
const STAGES: readonly (readonly [number, HeadingPlacement])[] = [
  [16 / 9, "over"],
  [1440 / 900, "over"],
  [4 / 3, "over"],
  [768 / 1024, "over"],
  [375 / 470, "apart"],
];
/** The slide toward the region's centre is exact only at the focus's depth; nearer and farther corners stray a little. */
const SLACK = 0.06;

const layout = new RoomLayout();
const shots = new RoomShots(layout, RULES);

function inside(projection: Projection, region: FrameRegion, slack: number): boolean {
  return (
    projection.depth > 0 &&
    projection.x >= region.left - slack &&
    projection.x <= region.right + slack &&
    projection.y >= region.bottom - slack &&
    projection.y <= region.top + slack
  );
}

describe("RoomShots", () => {
  it("fits the whole room snugly into the part of the frame the heading leaves", () => {
    const { min, max } = layout.extent();
    for (const [aspect, heading] of STAGES) {
      const region = RoomShots.region(aspect, heading);
      const { position, target } = shots.wide(RULES.wide, aspect, region);
      const out: Projection = { x: 0, y: 0, depth: 0 };
      const xs: number[] = [];
      const ys: number[] = [];
      for (const corner of corners(min, max)) {
        project(corner, position, target, RULES.wide.fov, aspect, out);
        expect(inside(out, region, SLACK), `${aspect} ${heading}`).toBe(true);
        xs.push(out.x);
        ys.push(out.y);
      }
      const width = Math.max(...xs) - Math.min(...xs);
      const height = Math.max(...ys) - Math.min(...ys);
      const snug = width >= 0.97 * (region.right - region.left) || height >= 0.97 * (region.top - region.bottom);
      expect(snug, `${aspect} ${heading}`).toBe(true);
    }
  });

  it("keeps the wide room to the right of a heading laid over a landscape stage", () => {
    const region = RoomShots.region(16 / 9, "over");
    expect(region.left).toBeGreaterThan(-0.2);
    const { position, target } = shots.wide(RULES.wide, 16 / 9, region);
    const { min, max } = layout.extent();
    const centre = { x: (min.x + max.x) / 2, y: (min.y + max.y) / 2, z: (min.z + max.z) / 2 };
    const out: Projection = { x: 0, y: 0, depth: 0 };
    project(centre, position, target, RULES.wide.fov, 16 / 9, out);
    expect(out.x).toBeGreaterThan(0.25);
  });

  it("ends with the screen filling its share of the frame, dead centre", () => {
    const screen = layout.screen();
    for (const [aspect] of STAGES) {
      const { position, target } = shots.fill(aspect);
      const out: Projection = { x: 0, y: 0, depth: 0 };
      project(screen.centre, position, target, RULES.fill.fov, aspect, out);
      expect(out.x).toBeCloseTo(0, 9);
      expect(out.y).toBeCloseTo(0, 9);
      const corner = { x: screen.centre.x + screen.width / 2, y: screen.centre.y + screen.height / 2, z: screen.centre.z };
      project(corner, position, target, RULES.fill.fov, aspect, out);
      expect(out.x).toBeLessThanOrEqual(RULES.fill.share + 1e-9);
      expect(out.y).toBeLessThanOrEqual(RULES.fill.share + 1e-9);
      expect(Math.max(out.x, out.y)).toBeCloseTo(RULES.fill.share, 9);
    }
  });

  it("strings the shots into a path that starts wide, keeps the room in view and ends on the screen", () => {
    for (const [aspect, heading] of STAGES) {
      const path = shots.path(aspect, heading);
      const pose = blankPose();
      const screen = layout.screen();
      const out: Projection = { x: 0, y: 0, depth: 0 };
      for (let p = 0; p <= 1.0001; p += 0.01) {
        path.sample(p, pose);
        expect(pose.position.y).toBeGreaterThan(layout.deskTop());
        expect(pose.position.x).toBeGreaterThan(-2.84);
        expect(pose.position.z).toBeGreaterThan(-2.4);
        project(screen.centre, pose.position, pose.target, pose.fov, aspect, out);
        expect(out.depth).toBeGreaterThan(0);
        expect(Math.abs(out.x)).toBeLessThan(1);
        expect(Math.abs(out.y)).toBeLessThan(1);
      }
      path.sample(1, pose);
      const fill = shots.fill(aspect);
      expect(pose.position.z).toBeCloseTo(fill.position.z, 9);
    }
  });

  it("refuses beats out of order and a share outside 0…1", () => {
    expect(() => new RoomShots(layout, { ...RULES, beats: { drift: 0.5, approach: 0.4, fill: 0.9 } })).toThrow();
    expect(() => new RoomShots(layout, { ...RULES, beats: { drift: 0.2, approach: 0.5, fill: 1 } })).toThrow();
    expect(() => new RoomShots(layout, { ...RULES, fill: { fov: 30, share: 1.2 } })).toThrow();
  });
});
