import { describe, expect, it } from "vitest";
import { HoverTilt } from "./HoverTilt";

describe("HoverTilt", () => {
  it("rests at the centre until aimed", () => {
    const tilt = new HoverTilt(4);
    tilt.settle(1);
    expect(tilt.x()).toBe(0);
    expect(tilt.y()).toBe(0);
  });

  it("follows the pointer with damping, y up", () => {
    const tilt = new HoverTilt(4);
    tilt.aim(100, 0, 100, 100);
    tilt.settle(0.1);
    expect(tilt.x()).toBeGreaterThan(0);
    expect(tilt.x()).toBeLessThan(1);
    expect(tilt.y()).toBeGreaterThan(0);
    tilt.settle(10);
    expect(tilt.x()).toBeCloseTo(1, 9);
    expect(tilt.y()).toBeCloseTo(1, 9);
  });

  it("follows at the same pace however the time is sliced", () => {
    const once = new HoverTilt(4);
    const sliced = new HoverTilt(4);
    once.aim(0, 50, 100, 100);
    sliced.aim(0, 50, 100, 100);
    once.settle(0.3);
    for (let step = 0; step < 6; step += 1) {
      sliced.settle(0.05);
    }
    expect(sliced.x()).toBeCloseTo(once.x(), 12);
  });

  it("clamps a pointer outside the box, and eases back to rest when released", () => {
    const tilt = new HoverTilt(4);
    tilt.aim(500, 500, 100, 100);
    tilt.settle(10);
    expect(tilt.x()).toBeCloseTo(1, 9);
    expect(tilt.y()).toBeCloseTo(-1, 9);
    tilt.release();
    tilt.settle(10);
    expect(Math.abs(tilt.x())).toBeLessThan(1e-9);
  });

  it("ignores a box with no size, and refuses a follow rate that never follows", () => {
    const tilt = new HoverTilt(4);
    tilt.aim(10, 10, 0, 100);
    tilt.settle(1);
    expect(tilt.x()).toBe(0);
    expect(() => new HoverTilt(0)).toThrow();
  });
});
