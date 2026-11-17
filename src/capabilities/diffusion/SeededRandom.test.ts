import { describe, expect, it } from "vitest";
import { SeededRandom } from "./SeededRandom";

describe("SeededRandom", () => {
  it("repeats the same sequence for the same seed", () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(42);
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
  });

  it("gives different sequences for different seeds", () => {
    expect(new SeededRandom(1).next()).not.toBe(new SeededRandom(2).next());
  });

  it("stays inside its ranges", () => {
    const random = new SeededRandom(7);
    for (let i = 0; i < 500; i += 1) {
      const unit = random.next();
      expect(unit).toBeGreaterThanOrEqual(0);
      expect(unit).toBeLessThan(1);
      const whole = random.int(3, 6);
      expect(Number.isInteger(whole)).toBe(true);
      expect(whole).toBeGreaterThanOrEqual(3);
      expect(whole).toBeLessThanOrEqual(6);
      const spread = random.range(-2, 2);
      expect(spread).toBeGreaterThanOrEqual(-2);
      expect(spread).toBeLessThan(2);
    }
  });

  it("reaches both ends of an integer range", () => {
    const random = new SeededRandom(11);
    const seen = new Set<number>();
    for (let i = 0; i < 200; i += 1) {
      seen.add(random.int(0, 2));
    }
    expect([...seen].sort()).toEqual([0, 1, 2]);
  });

  it("picks from a list and refuses an empty one", () => {
    const random = new SeededRandom(5);
    expect(["a", "b", "c"]).toContain(random.pick(["a", "b", "c"]));
    expect(() => random.pick([])).toThrow();
  });

  it("honours extreme probabilities", () => {
    const random = new SeededRandom(9);
    expect(random.chance(0)).toBe(false);
    expect(random.chance(1)).toBe(true);
  });

  it("rejects a seed that is not a number", () => {
    expect(() => new SeededRandom(Number.NaN)).toThrow();
  });
});
