import { describe, expect, it } from "vitest";
import { IsometricView, type Vec2 } from "../layers/IsometricView";
import { DioramaFraming } from "./DioramaFraming";
import { corners, dot, minus, point, type Point3 } from "./space";

const view = new IsometricView((40 * Math.PI) / 180, Math.PI / 6);
const box = corners({ min: point(-2, -0.5, -2), max: point(2, 2.5, 2) });
const reach = { yaw: 0.5, tilt: 0.05 };

/** Where a point lands on a canvas `width` × `height` for a camera fit, in CSS pixels from the canvas centre. */
function onCanvas(framing: DioramaFraming, width: number, height: number, subject: Point3): Vec2 {
  const fit = framing.fit(width, height);
  const offset = minus(subject, fit.target);
  return { x: dot(offset, view.right()) * fit.zoom, y: dot(offset, view.up()) * fit.zoom };
}

describe("DioramaFraming", () => {
  it("keeps every point inside the canvas, with the margin free, at any shape of canvas", () => {
    const framing = new DioramaFraming(view, box, reach, 0.05);
    for (const [width, height] of [
      [700, 700],
      [700, 560],
      [343, 343],
      [1200, 400],
    ]) {
      for (const corner of box) {
        const at = onCanvas(framing, width, height, corner);
        expect(Math.abs(at.x)).toBeLessThanOrEqual(width / 2 - width * 0.05 + 1e-6);
        expect(Math.abs(at.y)).toBeLessThanOrEqual(height / 2 - height * 0.05 + 1e-6);
      }
    }
  });

  it("fills the tighter side of the canvas", () => {
    const framing = new DioramaFraming(view, box, reach, 0.05);
    const bounds = framing.bounds();
    const fit = framing.fit(700, 700);
    const spanX = (bounds.maxX - bounds.minX) * fit.zoom;
    const spanY = (bounds.maxY - bounds.minY) * fit.zoom;
    expect(Math.max(spanX, spanY)).toBeCloseTo(700 * 0.9, 6);
  });

  it("reserves room for the island's turn", () => {
    const still = new DioramaFraming(view, box, { yaw: 0, tilt: 0 }, 0.05).bounds();
    const turning = new DioramaFraming(view, box, reach, 0.05).bounds();
    expect(turning.maxY - turning.minY).toBeGreaterThanOrEqual(still.maxY - still.minY);
    expect(turning.maxX - turning.minX).toBeGreaterThanOrEqual(still.maxX - still.minX - 1e-9);
  });

  it("stands the camera back along the view, looking at the drawing's centre", () => {
    const fit = new DioramaFraming(view, box, reach, 0.05).fit(700, 700);
    const back = minus(fit.position, fit.target);
    const toCamera = view.toCamera();
    expect(dot(back, toCamera) / Math.hypot(back.x, back.y, back.z)).toBeCloseTo(1, 9);
  });

  it("tells its margin, and refuses one that leaves no room", () => {
    expect(new DioramaFraming(view, box, reach, 0.04).margin()).toBe(0.04);
    expect(() => new DioramaFraming(view, box, reach, 0.5)).toThrow();
  });
});
