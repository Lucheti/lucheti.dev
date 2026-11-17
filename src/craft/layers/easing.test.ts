import { describe, expect, it } from "vitest";
import { clamp01, easeInOutCubic, easeOutCubic, smoothstep } from "./easing";

describe("easing", () => {
  it("clamps into 0…1", () => {
    expect(clamp01(-2)).toBe(0);
    expect(clamp01(0.4)).toBe(0.4);
    expect(clamp01(3)).toBe(1);
  });

  it("eases in and out from 0 to 1, symmetric about the middle", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.5)).toBe(0.5);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.2) + easeInOutCubic(0.8)).toBeCloseTo(1, 12);
    expect(easeInOutCubic(-1)).toBe(0);
    expect(easeInOutCubic(2)).toBe(1);
  });

  it("never runs backwards", () => {
    let last = -1;
    for (let t = 0; t <= 1; t += 0.01) {
      expect(easeInOutCubic(t)).toBeGreaterThanOrEqual(last);
      last = easeInOutCubic(t);
    }
  });

  it("eases out fast then soft", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });

  it("steps smoothly between two edges", () => {
    expect(smoothstep(0.5, 1, 0.2)).toBe(0);
    expect(smoothstep(0.5, 1, 0.75)).toBe(0.5);
    expect(smoothstep(0.5, 1, 1.4)).toBe(1);
  });
});
