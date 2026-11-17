import { describe, expect, it } from "vitest";
import { StageFit, type FitRules } from "./StageFit";

const BOUNDS = { minX: -2, maxX: 2, minY: -3, maxY: 3 };
const RULES: FitRules = { padding: 10, leader: 20, labelRoom: 100, maxZoom: 80 };

describe("StageFit", () => {
  it("fits by height on a wide stage, and centres the model and its labels together", () => {
    const fit = new StageFit({ width: 700, height: 320 }, BOUNDS, RULES);
    expect(fit.zoom()).toBeCloseTo(50, 12);
    const left = fit.toStage({ x: -2, y: 0 }, { x: 0, y: 0 }).x;
    const right = fit.toStage({ x: 2, y: 0 }, { x: 0, y: 0 }).x;
    expect(right - left).toBeCloseTo(200, 9);
    expect(fit.column()).toBeCloseTo(right + 20, 9);
    expect(left).toBeCloseTo(700 - (fit.column() + 100), 9);
  });

  it("fits by width on a phone, keeping the model and the label column inside the stage", () => {
    const fit = new StageFit({ width: 295, height: 288 }, BOUNDS, RULES);
    expect(fit.zoom()).toBeCloseTo((295 - 20 - 20 - 100) / 4, 12);
    const left = fit.toStage({ x: -2, y: 0 }, { x: 0, y: 0 }).x;
    expect(left).toBeCloseTo(10, 9);
    expect(fit.column() + 100).toBeCloseTo(285, 9);
    const top = fit.toStage({ x: 0, y: 3 }, { x: 0, y: 0 }).y;
    const bottom = fit.toStage({ x: 0, y: -3 }, { x: 0, y: 0 }).y;
    expect(top).toBeGreaterThanOrEqual(10);
    expect(bottom).toBeLessThanOrEqual(278);
    expect(top + bottom).toBeCloseTo(288, 9);
  });

  it("never draws larger than the cap", () => {
    expect(new StageFit({ width: 4000, height: 4000 }, BOUNDS, RULES).zoom()).toBe(80);
  });

  it("puts the look point at the stage's centre, y up on screen and down in pixels", () => {
    const fit = new StageFit({ width: 700, height: 320 }, BOUNDS, RULES);
    const centre = fit.toStage({ x: fit.lookX(), y: fit.lookY() }, { x: 0, y: 0 });
    expect(centre.x).toBeCloseTo(350, 9);
    expect(centre.y).toBeCloseTo(160, 9);
    const higher = fit.toStage({ x: fit.lookX(), y: fit.lookY() + 1 }, { x: 0, y: 0 });
    expect(higher.y).toBeLessThan(centre.y);
  });

  it("keeps a tiny positive zoom on a stage too small to fit, and refuses a model with no size", () => {
    expect(new StageFit({ width: 50, height: 50 }, BOUNDS, RULES).zoom()).toBeGreaterThan(0);
    expect(() => new StageFit({ width: 700, height: 320 }, { minX: 0, maxX: 0, minY: 0, maxY: 1 }, RULES)).toThrow();
  });
});
