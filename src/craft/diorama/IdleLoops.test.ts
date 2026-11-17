import { describe, expect, it } from "vitest";
import { IdleLoops, type IdleRules } from "./IdleLoops";

const RULES: IdleRules = {
  puffs: 3,
  steamSeconds: 3,
  steamRise: 0.5,
  swaySeconds: 5,
  sway: 0.04,
  bobSeconds: 3,
  bob: 0.01,
  breatheSeconds: 9,
  cloudSeconds: 20,
  arrivalSeconds: 7,
};
const idle = new IdleLoops(RULES);
const times = Array.from({ length: 600 }, (_, step) => step * 0.137);

describe("IdleLoops", () => {
  it("raises each puff of steam from the mug and fades it out before it starts again", () => {
    for (const seconds of times) {
      for (let puff = 0; puff < idle.puffs(); puff += 1) {
        const step = idle.steam(puff, seconds);
        expect(step.rise).toBeGreaterThanOrEqual(0);
        expect(step.rise).toBeLessThanOrEqual(RULES.steamRise);
        expect(step.size).toBeGreaterThanOrEqual(0);
        expect(step.size).toBeLessThanOrEqual(1);
      }
    }
    expect(idle.steam(0, 0).size).toBeCloseTo(0, 9);
    expect(idle.steam(0, 1.5).size).toBeCloseTo(1, 9);
  });

  it("keeps the puffs evenly out of step", () => {
    expect(idle.steam(1, 0).rise).toBeCloseTo(RULES.steamRise / 3, 9);
    expect(idle.steam(2, 0).rise).toBeCloseTo((2 * RULES.steamRise) / 3, 9);
  });

  it("sways the plants and bobs the duck within their reach", () => {
    for (const seconds of times) {
      expect(Math.abs(idle.sway(seconds, 0))).toBeLessThanOrEqual(RULES.sway + 1e-12);
      expect(Math.abs(idle.bob(seconds))).toBeLessThanOrEqual(RULES.bob + 1e-12);
    }
    expect(idle.sway(1, 0)).not.toBeCloseTo(idle.sway(1, 1.9), 4);
  });

  it("breathes the card from closed to open and back, holding at both ends", () => {
    expect(idle.breathe(0)).toBe(0);
    expect(idle.breathe(RULES.breatheSeconds * 0.5)).toBe(1);
    expect(idle.breathe(RULES.breatheSeconds * 0.97)).toBe(0);
    for (const seconds of times) {
      const open = idle.breathe(seconds);
      expect(open).toBeGreaterThanOrEqual(0);
      expect(open).toBeLessThanOrEqual(1);
    }
    expect(idle.breathe(2)).toBeCloseTo(idle.breathe(2 + RULES.breatheSeconds), 9);
  });

  it("drifts the cloud across the pane, growing in and shrinking out at the edges", () => {
    expect(idle.cloud(0)).toEqual({ across: 0, size: 0 });
    expect(idle.cloud(RULES.cloudSeconds / 2).size).toBe(1);
    expect(idle.cloud(RULES.cloudSeconds / 4).across).toBeCloseTo(0.25, 9);
  });

  it("counts arrivals one per interval", () => {
    expect(idle.arrivals(0)).toBe(0);
    expect(idle.arrivals(6.9)).toBe(0);
    expect(idle.arrivals(7)).toBe(1);
    expect(idle.arrivals(30)).toBe(4);
  });

  it("refuses loops of no length", () => {
    expect(() => new IdleLoops({ ...RULES, swaySeconds: 0 })).toThrow();
    expect(() => new IdleLoops({ ...RULES, puffs: 0 })).toThrow();
  });
});
