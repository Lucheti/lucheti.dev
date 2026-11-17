import { describe, expect, it } from "vitest";
import { CardSpread } from "./CardSpread";

const spread = new CardSpread({ layers: 5, closedGap: 0.1, openGap: 0.8 });

describe("CardSpread", () => {
  it("keeps the stack centred on its anchor, open or closed", () => {
    for (const openness of [0, 0.5, 1, 1.7]) {
      expect(spread.lift(0, openness) + spread.lift(4, openness)).toBeCloseTo(0, 12);
      expect(spread.lift(2, openness)).toBeCloseTo(0, 12);
    }
  });

  it("opens every gap from closed to open, and wider still for a pop", () => {
    expect(spread.lift(1, 0) - spread.lift(0, 0)).toBeCloseTo(0.1, 12);
    expect(spread.lift(1, 1) - spread.lift(0, 1)).toBeCloseTo(0.8, 12);
    expect(spread.gap(1.5)).toBeGreaterThan(0.8);
  });

  it("never closes tighter than closed, and keeps the layers in order", () => {
    expect(spread.gap(-1)).toBe(0.1);
    for (let layer = 1; layer < 5; layer += 1) {
      expect(spread.lift(layer, 0.3)).toBeGreaterThan(spread.lift(layer - 1, 0.3));
    }
  });

  it("refuses a card that cannot spread", () => {
    expect(() => new CardSpread({ layers: 1, closedGap: 0.1, openGap: 0.8 })).toThrow();
    expect(() => new CardSpread({ layers: 5, closedGap: 0.8, openGap: 0.8 })).toThrow();
  });
});
