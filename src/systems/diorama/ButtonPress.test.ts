import { describe, expect, it } from "vitest";
import { ButtonPress } from "./ButtonPress";

const press = new ButtonPress({ push: 0.08, hold: 0.06, frequency: 3, decay: 7, squash: 0.35 });

describe("ButtonPress", () => {
  it("rests before it is pressed and once it has settled", () => {
    for (const age of [Number.POSITIVE_INFINITY, -1, 5]) {
      expect(press.at(age)).toEqual({ depth: 0, tall: 1, wide: 1 });
      expect(press.settled(age)).toBe(true);
    }
  });

  it("plunges all the way in and squashes flat, wider as it gets shorter", () => {
    expect(press.at(0).depth).toBe(0);
    expect(press.at(0.04).depth).toBeGreaterThan(0.5);
    const held = press.at(0.1);
    expect(held.depth).toBe(1);
    expect(held.tall).toBeCloseTo(0.65);
    expect(held.wide).toBeGreaterThan(1);
    expect(press.settled(0.1)).toBe(false);
  });

  it("springs back up past its rest, stretched, before settling", () => {
    const ages = Array.from({ length: 200 }, (_, step) => 0.14 + step * 0.005);
    const overshoot = Math.min(...ages.map((age) => press.at(age).depth));
    expect(overshoot).toBeLessThan(-0.1);
    const stretched = ages.map((age) => press.at(age)).find((pose) => pose.depth < 0);
    expect(stretched?.tall).toBeGreaterThan(1);
    expect(Math.abs(press.at(1.1).depth)).toBeLessThan(0.01);
  });

  it("refuses a squash that would flatten it away", () => {
    expect(() => new ButtonPress({ push: 0.08, hold: 0, frequency: 3, decay: 7, squash: 1 })).toThrow();
    expect(() => new ButtonPress({ push: 0, hold: 0, frequency: 3, decay: 7, squash: 0.3 })).toThrow();
  });
});
