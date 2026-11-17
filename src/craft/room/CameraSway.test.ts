import { describe, expect, it } from "vitest";
import type { CameraPose } from "./CameraPath";
import { CameraSway } from "./CameraSway";

const DEGREE = Math.PI / 180;

function pose(): CameraPose {
  return { position: { x: 4, y: 3, z: 5 }, target: { x: 0, y: 1, z: -1 }, fov: 30 };
}

function gap(a: CameraPose): number {
  return Math.hypot(a.position.x - a.target.x, a.position.y - a.target.y, a.position.z - a.target.z);
}

describe("CameraSway", () => {
  const sway = new CameraSway(3 * DEGREE, 2 * DEGREE);

  it("leaves the pose alone when the pointer is centred or the weight is zero", () => {
    expect(sway.apply(pose(), 0, 0, 1)).toEqual(pose());
    expect(sway.apply(pose(), 1, 1, 0)).toEqual(pose());
  });

  it("keeps the camera's distance to its target and never moves the target", () => {
    const before = pose();
    const after = sway.apply(pose(), 0.7, -0.4, 1);
    expect(gap(after)).toBeCloseTo(gap(before), 9);
    expect(after.target).toEqual(before.target);
  });

  it("turns no further than its reach", () => {
    const before = pose();
    const after = sway.apply(pose(), 1, 1, 1);
    const a = { x: before.position.x - before.target.x, y: before.position.y - before.target.y, z: before.position.z - before.target.z };
    const b = { x: after.position.x - after.target.x, y: after.position.y - after.target.y, z: after.position.z - after.target.z };
    const angle = Math.acos((a.x * b.x + a.y * b.y + a.z * b.z) / (gap(before) * gap(after)));
    expect(angle).toBeGreaterThan(0);
    expect(angle).toBeLessThanOrEqual(Math.hypot(3, 2) * DEGREE + 1e-9);
  });

  it("raises the camera when the pointer is up", () => {
    const after = sway.apply(pose(), 0, 1, 1);
    expect(after.position.y).toBeGreaterThan(pose().position.y);
  });

  it("refuses a negative reach", () => {
    expect(() => new CameraSway(-1, 0)).toThrow();
  });
});
