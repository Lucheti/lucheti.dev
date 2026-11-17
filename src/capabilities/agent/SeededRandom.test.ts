import { describe, expect, it } from "vitest";
import { SeededRandom } from "./SeededRandom";

describe("SeededRandom", () => {
  it("repeats the same sequence for the same seed", () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(42);
    const first = Array.from({ length: 8 }, () => a.next());
    const second = Array.from({ length: 8 }, () => b.next());
    expect(first).toEqual(second);
  });

  it("differs between seeds", () => {
    expect(new SeededRandom(1).next()).not.toBe(new SeededRandom(2).next());
  });

  it("keeps floats in [0, 1) and integers inside their bounds", () => {
    const random = new SeededRandom(7);
    for (let i = 0; i < 500; i += 1) {
      const float = random.next();
      expect(float).toBeGreaterThanOrEqual(0);
      expect(float).toBeLessThan(1);
      const whole = random.int(1, 3);
      expect([1, 2, 3]).toContain(whole);
    }
  });

  it("refuses a seed that is not a number, and a range out of order", () => {
    expect(() => new SeededRandom(Number.NaN)).toThrow();
    expect(() => new SeededRandom(1).int(3, 1)).toThrow();
  });
});
