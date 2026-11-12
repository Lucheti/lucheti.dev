import { describe, expect, it } from "vitest";
import { CubicBezier } from "./CubicBezier";

const EASE_OUT_EXPO = new CubicBezier(0.16, 1, 0.3, 1);

describe("CubicBezier", () => {
  it("starts at zero and ends at one", () => {
    expect(EASE_OUT_EXPO.at(0)).toBeCloseTo(0);
    expect(EASE_OUT_EXPO.at(1)).toBeCloseTo(1);
  });

  it("is linear when the control points sit on the diagonal", () => {
    const linear = new CubicBezier(0, 0, 1, 1);
    expect(linear.at(0.25)).toBeCloseTo(0.25, 4);
    expect(linear.at(0.8)).toBeCloseTo(0.8, 4);
  });

  it("front-loads the movement for ease-out-expo", () => {
    expect(EASE_OUT_EXPO.at(0.1)).toBeGreaterThan(0.45);
    expect(EASE_OUT_EXPO.at(0.5)).toBeGreaterThan(0.95);
  });

  it("samples evenly in time and never goes backwards", () => {
    const points = EASE_OUT_EXPO.sample(24);
    expect(points).toHaveLength(24);
    expect(points[0].x).toBe(0);
    expect(points[23].x).toBe(1);
    for (let index = 1; index < points.length; index += 1) {
      expect(points[index].y).toBeGreaterThanOrEqual(points[index - 1].y);
    }
  });

  it("rejects curves that would run time backwards", () => {
    expect(() => new CubicBezier(-0.1, 0, 0.5, 1)).toThrow();
    expect(() => EASE_OUT_EXPO.sample(1)).toThrow();
  });
});
