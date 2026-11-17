import { describe, expect, it } from "vitest";
import { hop, popIn, pulse, ring, SETTLED_AFTER, squash } from "./curves";

const NEVER = Number.POSITIVE_INFINITY;

describe("reaction curves", () => {
  it("rest before they start and when they never did", () => {
    for (const age of [NEVER, -1]) {
      expect(ring(age, 2, 3)).toBe(0);
      expect(pulse(age, 0.05, 0.2)).toBe(0);
      expect(hop(age, 0.4)).toBe(0);
      expect(squash(age, 0.3)).toEqual({ tall: 1, wide: 1 });
      expect(popIn(age)).toBe(1);
    }
  });

  it("start from rest and settle back to it", () => {
    expect(ring(0, 2, 3)).toBe(0);
    expect(pulse(0, 0.05, 0.2)).toBe(0);
    expect(Math.abs(ring(SETTLED_AFTER, 2.4, 5.5))).toBeLessThan(1e-4);
    expect(pulse(SETTLED_AFTER, 0.03, 0.16)).toBeLessThan(1e-4);
    const late = squash(SETTLED_AFTER, 0.34);
    expect(late.tall).toBeCloseTo(1, 4);
    expect(late.wide).toBeCloseTo(1, 4);
  });

  it("squash first, short and wide, then stretch", () => {
    const early = squash(0.05, 0.3);
    expect(early.tall).toBeLessThan(1);
    expect(early.wide).toBeGreaterThan(1);
    const later = squash(0.3, 0.3);
    expect(later.tall).toBeGreaterThan(1);
  });

  it("stay within their reach", () => {
    for (let age = 0; age < 3; age += 0.01) {
      expect(Math.abs(ring(age, 2, 3))).toBeLessThanOrEqual(1);
      expect(pulse(age, 0.03, 0.16)).toBeLessThan(1);
      expect(hop(age, 0.42)).toBeGreaterThanOrEqual(0);
      expect(hop(age, 0.42)).toBeLessThanOrEqual(1);
    }
  });

  it("hop once and land", () => {
    expect(hop(0.21, 0.42)).toBeCloseTo(1, 9);
    expect(hop(0.5, 0.42)).toBe(0);
  });

  it("pop in from nothing past full size and settle at it", () => {
    expect(popIn(0)).toBeCloseTo(0, 9);
    let peak = 0;
    for (let age = 0; age <= 0.35; age += 0.01) {
      peak = Math.max(peak, popIn(age));
    }
    expect(peak).toBeGreaterThan(1);
    expect(popIn(1)).toBe(1);
  });
});
