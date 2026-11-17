import { describe, expect, it } from "vitest";
import { composeLayersToy } from "./composeLayersToy";
import type { Vec2 } from "./IsometricView";

const PHONE = { width: 295, height: 288 };
const DESKTOP = { width: 700, height: 320 };

describe("StackStage", () => {
  const toy = composeLayersToy();
  const { stage, choreography, blueprint, view } = toy;

  it("keeps the whole breath, swaying and leaning, inside the stage from a phone to a desktop", () => {
    for (const size of [PHONE, DESKTOP]) {
      const fit = stage.fit(size);
      const { width, depth } = blueprint.footprint();
      const out: Vec2 = { x: 0, y: 0 };
      const pixel: Vec2 = { x: 0, y: 0 };
      for (let time = 0; time < choreography.breath() * 2; time += 97) {
        for (const lean of [-1, 0, 1]) {
          const yaw = stage.yaw(time, lean);
          const tilt = stage.tilt(lean);
          blueprint.layers().forEach((spec, layer) => {
            const base = choreography.lift(layer, time);
            for (const x of [-width / 2, width / 2]) {
              for (const z of [-depth / 2, depth / 2]) {
                for (const y of [base, base + spec.thickness]) {
                  fit.toStage(view.project({ x, y, z }, yaw, tilt, out), pixel);
                  expect(pixel.x).toBeGreaterThanOrEqual(0);
                  expect(pixel.x).toBeLessThanOrEqual(size.width);
                  expect(pixel.y).toBeGreaterThanOrEqual(0);
                  expect(pixel.y).toBeLessThanOrEqual(size.height);
                }
              }
            }
          });
        }
      }
      expect(fit.column() + 100).toBeLessThanOrEqual(size.width);
    }
  });

  it("pins each label at its layer's corner, left of the label column and higher for higher layers", () => {
    const fit = stage.fit(DESKTOP);
    const time = choreography.stillMs();
    const points = blueprint.layers().map((_, layer) => stage.labelPoint(layer, time, 0, 0, fit, { x: 0, y: 0 }));
    for (const point of points) {
      expect(point.x).toBeLessThan(fit.column());
      expect(point.x).toBeCloseTo(points[0].x, 9);
    }
    for (let layer = 1; layer < points.length; layer += 1) {
      expect(points[layer - 1].y - points[layer].y).toBeGreaterThan(24);
    }
  });

  it("adds the pointer's lean to the sway, and tilts the other way to the pointer's height", () => {
    const time = choreography.stillMs();
    expect(stage.yaw(time, 0)).toBeCloseTo(0, 12);
    expect(stage.yaw(time, 1)).toBeGreaterThan(0);
    expect(stage.tilt(1)).toBeLessThan(0);
    expect(stage.tilt(0)).toBeCloseTo(0, 12);
  });
});
