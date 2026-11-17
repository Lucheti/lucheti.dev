import { describe, expect, it } from "vitest";
import { blankPose, CameraPath, paced, type CameraKeyframe, type Pace } from "./CameraPath";
import { point } from "./space";

const KEYFRAMES: readonly CameraKeyframe[] = [
  { at: 0, position: point(10, 8, 10), target: point(0, 1, 0), fov: 22, pace: "steady" },
  { at: 0.25, position: point(9, 7.5, 10.5), target: point(0, 1, 0), fov: 22, pace: "steady" },
  { at: 0.6, position: point(2, 2, 1), target: point(0.3, 1.1, -2), fov: 28, pace: "glide" },
  { at: 0.85, position: point(0.3, 1.27, -1), target: point(0.3, 1.27, -2.5), fov: 30, pace: "glide" },
  { at: 1, position: point(0.3, 1.27, -1), target: point(0.3, 1.27, -2.5), fov: 30, pace: "steady" },
];

function distance(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

describe("paced", () => {
  it("keeps the ends of every pace fixed and stays inside 0…1", () => {
    const paces: readonly Pace[] = ["steady", "gather", "settle", "glide"];
    for (const pace of paces) {
      expect(paced(pace, 0)).toBe(0);
      expect(paced(pace, 1)).toBe(1);
      expect(paced(pace, -1)).toBe(0);
      expect(paced(pace, 2)).toBe(1);
      for (let t = 0; t <= 1; t += 0.1) {
        expect(paced(pace, t)).toBeGreaterThanOrEqual(0);
        expect(paced(pace, t)).toBeLessThanOrEqual(1);
      }
    }
  });

  it("gathers slowly, settles quickly", () => {
    expect(paced("gather", 0.5)).toBeLessThan(0.5);
    expect(paced("settle", 0.5)).toBeGreaterThan(0.5);
    expect(paced("glide", 0.5)).toBeCloseTo(0.5);
  });
});

describe("CameraPath", () => {
  const path = new CameraPath(KEYFRAMES);

  it("lands exactly on every keyframe at its progress", () => {
    const pose = blankPose();
    for (const frame of KEYFRAMES) {
      path.sample(frame.at, pose);
      expect(distance(pose.position, frame.position)).toBeLessThan(1e-9);
      expect(distance(pose.target, frame.target)).toBeLessThan(1e-9);
      expect(pose.fov).toBeCloseTo(frame.fov, 9);
    }
  });

  it("clamps progress outside 0…1 and treats a non-number as the start", () => {
    const pose = blankPose();
    path.sample(-0.5, pose);
    expect(distance(pose.position, KEYFRAMES[0].position)).toBeLessThan(1e-9);
    path.sample(1.5, pose);
    expect(distance(pose.position, KEYFRAMES[4].position)).toBeLessThan(1e-9);
    path.sample(Number.NaN, pose);
    expect(distance(pose.position, KEYFRAMES[0].position)).toBeLessThan(1e-9);
  });

  it("holds perfectly still between two equal keyframes", () => {
    const pose = blankPose();
    for (let p = 0.85; p <= 1; p += 0.01) {
      path.sample(p, pose);
      expect(distance(pose.position, KEYFRAMES[3].position)).toBeLessThan(1e-9);
      expect(distance(pose.target, KEYFRAMES[3].target)).toBeLessThan(1e-9);
    }
  });

  it("moves continuously: a tiny step in progress is a tiny step in space", () => {
    const pose = blankPose();
    const before = { x: 0, y: 0, z: 0 };
    path.sample(0, pose);
    Object.assign(before, pose.position);
    for (let p = 0.001; p <= 1; p += 0.001) {
      path.sample(p, pose);
      expect(distance(pose.position, before)).toBeLessThan(0.15);
      Object.assign(before, pose.position);
    }
  });

  it("widens the field of view steadily between keyframes that widen it", () => {
    const pose = blankPose();
    let last = 0;
    for (let p = 0; p <= 1; p += 0.02) {
      path.sample(p, pose);
      expect(pose.fov).toBeGreaterThanOrEqual(last - 1e-9);
      last = pose.fov;
    }
  });

  it("refuses keyframes that are out of order, short of 0…1, too few or looking at themselves", () => {
    const [first, second] = KEYFRAMES;
    expect(() => new CameraPath([first])).toThrow();
    expect(() => new CameraPath([first, { ...second, at: 0.5 }])).toThrow();
    expect(() => new CameraPath([{ ...first, at: 0.1 }, { ...second, at: 1 }])).toThrow();
    expect(() => new CameraPath([first, { ...second, at: 0 }, { ...second, at: 1 }])).toThrow();
    expect(() => new CameraPath([first, { ...second, at: 1, fov: 0 }])).toThrow();
    expect(() => new CameraPath([first, { ...second, at: 1, target: second.position }])).toThrow();
    expect(() => new CameraPath([first, { ...second, at: 1, position: point(Number.NaN, 0, 0) }])).toThrow();
  });
});
