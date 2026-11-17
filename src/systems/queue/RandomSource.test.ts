import { describe, expect, it } from "vitest";
import { ManualClock } from "./Clock";
import { jittered, SeededRandom } from "./RandomSource";

describe("SeededRandom", () => {
  it("repeats its run for the same seed and stays in [0, 1)", () => {
    const first = new SeededRandom(99);
    const second = new SeededRandom(99);
    const run = Array.from({ length: 500 }, () => first.next());
    expect(Array.from({ length: 500 }, () => second.next())).toEqual(run);
    expect(Math.min(...run)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...run)).toBeLessThan(1);
    expect(new SeededRandom(100).next()).not.toBe(run[0]);
  });

  it("refuses a seed that is not an integer", () => {
    expect(() => new SeededRandom(0.5)).toThrow();
  });

  it("jitters a mean within its bounds", () => {
    const random = new SeededRandom(3);
    const values = Array.from({ length: 500 }, () => jittered(random, 100, 0.4));
    expect(Math.min(...values)).toBeGreaterThanOrEqual(60);
    expect(Math.max(...values)).toBeLessThanOrEqual(140);
  });
});

describe("ManualClock", () => {
  it("moves only forward, and only when told", () => {
    const clock = new ManualClock(10);
    clock.advance(5);
    expect(clock.now()).toBe(15);
    expect(() => clock.advance(-1)).toThrow();
    expect(() => new ManualClock(Number.NaN)).toThrow();
  });
});
