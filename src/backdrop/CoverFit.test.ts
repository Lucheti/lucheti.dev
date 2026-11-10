import { describe, expect, it } from "vitest";
import { CoverFit } from "./CoverFit";

describe("CoverFit", () => {
  const fit = new CoverFit(0.62, 0.5);
  const frame = { width: 1600, height: 900 };

  it("fills a canvas of the same aspect without cropping", () => {
    expect(fit.rectFor(frame, { width: 800, height: 450 })).toEqual({
      x: 0,
      y: 0,
      width: 800,
      height: 450,
    });
  });

  it("crops the sides of a portrait canvas around the focal x", () => {
    const rect = fit.rectFor(frame, { width: 450, height: 900 });
    expect(rect.height).toBe(900);
    expect(rect.width).toBe(1600);
    expect(rect.x).toBeCloseTo(-(1600 - 450) * 0.62);
    expect(rect.y).toBe(0);
  });

  it("crops top and bottom around the focal y on a wide canvas", () => {
    const rect = fit.rectFor(frame, { width: 1600, height: 450 });
    expect(rect.width).toBe(1600);
    expect(rect.height).toBe(900);
    expect(rect.y).toBeCloseTo(-225);
  });

  it("always covers the whole canvas", () => {
    const canvas = { width: 1234, height: 777 };
    const rect = fit.rectFor(frame, canvas);
    expect(rect.x).toBeLessThanOrEqual(0);
    expect(rect.y).toBeLessThanOrEqual(0);
    expect(rect.x + rect.width).toBeGreaterThanOrEqual(canvas.width - 1e-9);
    expect(rect.y + rect.height).toBeGreaterThanOrEqual(canvas.height - 1e-9);
  });

  it("recomputes when the canvas changes after a memoised call", () => {
    fit.rectFor(frame, { width: 800, height: 450 });
    expect(fit.rectFor(frame, { width: 450, height: 900 }).height).toBe(900);
  });

  it("rejects a focal point outside the frame and an empty frame", () => {
    expect(() => new CoverFit(1.2, 0.5)).toThrow(RangeError);
    expect(() => fit.rectFor({ width: 0, height: 10 }, { width: 10, height: 10 })).toThrow(
      RangeError,
    );
  });
});
