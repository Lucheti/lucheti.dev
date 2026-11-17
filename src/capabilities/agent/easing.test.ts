import { describe, expect, it } from "vitest";
import { clamp01, easeInOutSine, easeOutBack, easeOutCubic, lerp, squashStretch } from "./easing";

describe("easing", () => {
  it("runs each curve from 0 to 1", () => {
    for (const curve of [easeInOutSine, easeOutCubic, easeOutBack]) {
      expect(curve(0)).toBeCloseTo(0, 6);
      expect(curve(1)).toBeCloseTo(1, 6);
    }
  });

  it("clamps progress outside [0, 1]", () => {
    expect(clamp01(-2)).toBe(0);
    expect(clamp01(3)).toBe(1);
    expect(easeInOutSine(5)).toBeCloseTo(1, 6);
  });

  it("overshoots on the way in for a pop", () => {
    const peak = Math.max(...Array.from({ length: 50 }, (_, i) => easeOutBack(i / 49)));
    expect(peak).toBeGreaterThan(1.05);
  });

  it("interpolates between two numbers", () => {
    expect(lerp(10, 20, 0.25)).toBe(12.5);
  });

  it("squashes first, stretches next and settles at rest, keeping the area", () => {
    const start = squashStretch(0);
    expect(start.y).toBeLessThan(0.85);
    expect(start.x).toBeGreaterThan(1.1);
    expect(squashStretch(1 / 3).y).toBeGreaterThan(1.02);
    const end = squashStretch(1);
    expect(end.y).toBeCloseTo(1, 1);
    for (const p of [0, 0.2, 0.5, 0.8, 1]) {
      const scale = squashStretch(p);
      expect(scale.x * scale.y).toBeCloseTo(1, 9);
    }
  });
});
