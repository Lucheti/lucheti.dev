import { describe, expect, it } from "vitest";
import { IdleMotion } from "./IdleMotion";

const idle = new IdleMotion({ bob: 0.02, bobSeconds: 6, rock: 0.03, flicker: 0.02 });

describe("IdleMotion", () => {
  it("bobs and rocks each card within its reach", () => {
    for (let card = 0; card < 3; card += 1) {
      for (let seconds = 0; seconds < 60; seconds += 0.37) {
        expect(Math.abs(idle.rise(card, seconds))).toBeLessThanOrEqual(0.02 + 1e-12);
        expect(Math.abs(idle.rock(card, seconds))).toBeLessThanOrEqual(0.03 + 1e-12);
      }
    }
  });

  it("keeps the cards out of step with one another", () => {
    expect(idle.rise(0, 1)).not.toBeCloseTo(idle.rise(1, 1), 3);
  });

  it("repeats a bob after its length", () => {
    expect(idle.rise(1, 2)).toBeCloseTo(idle.rise(1, 8), 9);
  });

  it("wavers the lamp barely, either side of its level", () => {
    let low = Infinity;
    let high = -Infinity;
    for (let seconds = 0; seconds < 120; seconds += 0.05) {
      const level = idle.lamp(seconds);
      low = Math.min(low, level);
      high = Math.max(high, level);
    }
    expect(low).toBeGreaterThanOrEqual(0.98 - 1e-12);
    expect(high).toBeLessThanOrEqual(1.02 + 1e-12);
    expect(high - low).toBeGreaterThan(0.01);
  });

  it("refuses a bob of no length or a flicker that could put the lamp out", () => {
    expect(() => new IdleMotion({ bob: 0.02, bobSeconds: 0, rock: 0, flicker: 0 })).toThrow();
    expect(() => new IdleMotion({ bob: 0.02, bobSeconds: 6, rock: 0, flicker: 1 })).toThrow();
  });
});
