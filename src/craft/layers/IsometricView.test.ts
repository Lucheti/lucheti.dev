import { describe, expect, it } from "vitest";
import { ISOMETRIC_PITCH, IsometricView, type Vec2, type Vec3 } from "./IsometricView";

const DEGREE = Math.PI / 180;

function project(view: IsometricView, point: Vec3, yaw = 0, tilt = 0): Vec2 {
  return view.project(point, yaw, tilt, { x: 0, y: 0 });
}

function length(v: Readonly<Vec3>): number {
  return Math.hypot(v.x, v.y, v.z);
}

function dot(a: Readonly<Vec3>, b: Readonly<Vec3>): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

describe("IsometricView", () => {
  const view = new IsometricView();

  it("looks down the cube's diagonal at about 35.264°", () => {
    expect(ISOMETRIC_PITCH / DEGREE).toBeCloseTo(35.264, 3);
    const back = view.toCamera();
    expect(back.x).toBeCloseTo(1 / Math.sqrt(3), 12);
    expect(back.y).toBeCloseTo(1 / Math.sqrt(3), 12);
    expect(back.z).toBeCloseTo(1 / Math.sqrt(3), 12);
  });

  it("has an orthonormal screen frame, the way three.js's lookAt builds it", () => {
    const right = view.right();
    const up = view.up();
    const back = view.toCamera();
    for (const axis of [right, up, back]) {
      expect(length(axis)).toBeCloseTo(1, 12);
    }
    expect(dot(right, up)).toBeCloseTo(0, 12);
    expect(dot(right, back)).toBeCloseTo(0, 12);
    expect(dot(up, back)).toBeCloseTo(0, 12);
    expect(right.y).toBe(0);
    expect(up.y).toBeGreaterThan(0);
  });

  it("projects the three axes to equal lengths, 120° apart", () => {
    const x = project(view, { x: 1, y: 0, z: 0 });
    const y = project(view, { x: 0, y: 1, z: 0 });
    const z = project(view, { x: 0, y: 0, z: 1 });
    const lengths = [x, y, z].map((p) => Math.hypot(p.x, p.y));
    expect(lengths[0]).toBeCloseTo(Math.sqrt(2 / 3), 12);
    expect(lengths[1]).toBeCloseTo(lengths[0], 12);
    expect(lengths[2]).toBeCloseTo(lengths[0], 12);
    const angle = (a: Vec2, b: Vec2): number => Math.acos((a.x * b.x + a.y * b.y) / (Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y)));
    expect(angle(x, z) / DEGREE).toBeCloseTo(120, 9);
    expect(angle(x, y) / DEGREE).toBeCloseTo(120, 9);
    expect(y.x).toBeCloseTo(0, 12);
  });

  it("draws a square on the floor as a diamond √3 times wider than tall", () => {
    const corners = [-1, 1].flatMap((x) => [-1, 1].map((z) => project(view, { x, y: 0, z })));
    const width = Math.max(...corners.map((p) => p.x)) - Math.min(...corners.map((p) => p.x));
    const height = Math.max(...corners.map((p) => p.y)) - Math.min(...corners.map((p) => p.y));
    expect(width / height).toBeCloseTo(Math.sqrt(3), 12);
  });

  it("turns about the vertical axis the way three.js does", () => {
    const turned = view.turn({ x: 1, y: 0.3, z: 0 }, Math.PI / 2, 0, { x: 0, y: 0, z: 0 });
    expect(turned.x).toBeCloseTo(0, 12);
    expect(turned.y).toBeCloseTo(0.3, 12);
    expect(turned.z).toBeCloseTo(-1, 12);
  });

  it("tilts about the screen's right axis: that axis stays put and lengths are kept", () => {
    const right = view.right();
    const still = view.turn({ x: right.x, y: right.y, z: right.z }, 0, 0.3, { x: 0, y: 0, z: 0 });
    expect(still.x).toBeCloseTo(right.x, 12);
    expect(still.z).toBeCloseTo(right.z, 12);
    const point = { x: 0.4, y: -1.2, z: 2 };
    expect(length(view.turn(point, 0.2, 0.25, { x: 0, y: 0, z: 0 }))).toBeCloseTo(length(point), 12);
    const leaned = project(view, { x: 0, y: 1, z: 0 }, 0, 0.1);
    expect(leaned.x).toBeCloseTo(0, 12);
  });

  it("measures the bounds of points over every turn the model may take", () => {
    const points = [{ x: 1, y: 0, z: -1 }];
    const straight = view.bounds(points, 0, 0);
    expect(straight.minX).toBeCloseTo(straight.maxX, 12);
    const swaying = view.bounds(points, 0.2, 0);
    expect(swaying.maxX - swaying.minX).toBeGreaterThan(0);
    expect(() => view.bounds([], 0, 0)).toThrow();
  });

  it("refuses a camera that does not look down", () => {
    expect(() => new IsometricView(0, 0)).toThrow();
    expect(() => new IsometricView(0, Math.PI / 2)).toThrow();
  });
});
