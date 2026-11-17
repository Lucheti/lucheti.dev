import { describe, expect, it } from "vitest";
import { ExplodeTiming, type ExplodeRules } from "./ExplodeTiming";

const RULES: ExplodeRules = {
  cards: 3,
  layers: 5,
  from: 0.3,
  to: 0.5,
  cardStagger: 0.05,
  gapStagger: 0.015,
  closedGap: 0.13,
  openGap: 0.8,
};
const timing = new ExplodeTiming(RULES);

describe("ExplodeTiming", () => {
  it("keeps every card closed before its window and open after it", () => {
    for (let card = 0; card < 3; card += 1) {
      for (let gap = 1; gap < 5; gap += 1) {
        expect(timing.opening(card, gap, 0)).toBe(0);
        expect(timing.opening(card, gap, 0.3)).toBe(0);
        expect(timing.opening(card, gap, 0.5 + card * 0.05)).toBeCloseTo(1, 9);
        expect(timing.opening(card, gap, 1)).toBe(1);
      }
    }
  });

  it("opens the cards one after another", () => {
    const p = 0.46;
    expect(timing.opening(2, 2, p)).toBeGreaterThan(0);
    expect(timing.opening(0, 2, p)).toBeGreaterThan(timing.opening(1, 2, p));
    expect(timing.opening(1, 2, p)).toBeGreaterThan(timing.opening(2, 2, p));
  });

  it("opens the top gap of a card before the ones under it", () => {
    const p = 0.34;
    const openings = [1, 2, 3, 4].map((gap) => timing.opening(0, gap, p));
    expect(openings[3]).toBeGreaterThan(openings[2]);
    expect(openings[2]).toBeGreaterThan(openings[1]);
    expect(openings[1]).toBeGreaterThan(openings[0]);
  });

  it("keeps the layers in order, never closer than closed or farther than open, centred on the anchor", () => {
    for (let p = 0; p <= 1; p += 0.01) {
      const lifts = [0, 1, 2, 3, 4].map((layer) => timing.lift(0, layer, p));
      for (let layer = 1; layer < 5; layer += 1) {
        const gap = lifts[layer] - lifts[layer - 1];
        expect(gap).toBeGreaterThanOrEqual(RULES.closedGap - 1e-9);
        expect(gap).toBeLessThanOrEqual(RULES.openGap + 1e-9);
      }
      expect(lifts[0] + lifts[4]).toBeCloseTo(0, 9);
    }
  });

  it("refuses windows that spill past the end or are shorter than their stagger", () => {
    expect(() => new ExplodeTiming({ ...RULES, to: 0.95, cardStagger: 0.1 })).toThrow();
    expect(() => new ExplodeTiming({ ...RULES, to: 0.33 })).toThrow();
    expect(() => new ExplodeTiming({ ...RULES, layers: 1 })).toThrow();
    expect(() => new ExplodeTiming({ ...RULES, openGap: 0.1 })).toThrow();
  });
});
