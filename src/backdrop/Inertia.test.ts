import { describe, expect, it } from "vitest";
import { Inertia } from "./Inertia";

const FRAME = 1000 / 60;

describe("Inertia", () => {
  it("covers its rate of the remaining distance per 60Hz frame", () => {
    const inertia = new Inertia(0, 0.12);
    inertia.advance(100, FRAME);
    expect(inertia.current()).toBeCloseTo(12);
  });

  it("moves the same distance in the same time at 120Hz", () => {
    const sixty = new Inertia(0, 0.12);
    sixty.advance(100, FRAME);
    sixty.advance(100, FRAME);
    const oneTwenty = new Inertia(0, 0.12);
    for (let i = 0; i < 4; i += 1) {
      oneTwenty.advance(100, FRAME / 2);
    }
    expect(oneTwenty.current()).toBeCloseTo(sixty.current());
  });

  it("settles exactly on the target and then reports no change", () => {
    const inertia = new Inertia(0, 0.12);
    let steps = 0;
    while (inertia.advance(10, FRAME) && steps < 500) {
      steps += 1;
    }
    expect(inertia.current()).toBe(10);
    expect(inertia.isSettledAt(10)).toBe(true);
    expect(inertia.advance(10, FRAME)).toBe(false);
  });

  it("follows instantly at a rate of 1", () => {
    const inertia = new Inertia(0, 1);
    inertia.advance(42, FRAME);
    expect(inertia.current()).toBe(42);
  });

  it("rejects a rate outside (0, 1]", () => {
    expect(() => new Inertia(0, 0)).toThrow(RangeError);
    expect(() => new Inertia(0, 1.5)).toThrow(RangeError);
  });
});
