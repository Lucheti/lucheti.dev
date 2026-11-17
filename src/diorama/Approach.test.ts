import { describe, expect, it } from "vitest";
import { Approach } from "./Approach";

describe("Approach", () => {
  it("glides toward its target and lands on it exactly", () => {
    const value = new Approach(0, 10);
    value.toward(1, 0.05);
    expect(value.value()).toBeGreaterThan(0);
    expect(value.value()).toBeLessThan(1);
    expect(value.at(1)).toBe(false);
    value.toward(1, 5);
    expect(value.value()).toBe(1);
    expect(value.at(1)).toBe(true);
  });

  it("moves at the same pace however the time is sliced", () => {
    const once = new Approach(0, 6);
    const sliced = new Approach(0, 6);
    once.toward(1, 0.2);
    for (let slice = 0; slice < 4; slice += 1) {
      sliced.toward(1, 0.05);
    }
    expect(sliced.value()).toBeCloseTo(once.value(), 12);
  });

  it("snaps at once, and ignores time running backwards", () => {
    const value = new Approach(0, 6);
    value.snap(0.7);
    expect(value.value()).toBe(0.7);
    value.toward(0, -1);
    expect(value.value()).toBe(0.7);
  });

  it("refuses a rate that never arrives", () => {
    expect(() => new Approach(0, 0)).toThrow();
    expect(() => new Approach(Number.NaN, 4)).toThrow();
  });
});
