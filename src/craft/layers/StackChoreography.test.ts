import { describe, expect, it } from "vitest";
import { StackChoreography, type StackSpacing, type StackTiming } from "./StackChoreography";

const TIMING: StackTiming = {
  stackedMs: 1000,
  openMs: 2000,
  explodedMs: 2000,
  closeMs: 2000,
  staggerMs: 100,
  swayMs: 16000,
  rippleMs: 2000,
};
const SPACING: StackSpacing = { layers: 5, stackedGap: 0.1, explodedGap: 0.8, swayRadians: 0.14, ripples: 2 };

function make(timing: Partial<StackTiming> = {}, spacing: Partial<StackSpacing> = {}): StackChoreography {
  return new StackChoreography({ ...TIMING, ...timing }, { ...SPACING, ...spacing });
}

describe("StackChoreography", () => {
  const choreography = make();

  it("adds the four beats into one breath", () => {
    expect(choreography.breath()).toBe(7000);
  });

  it("holds every gap closed, then fully open, then closed again", () => {
    for (let gap = 1; gap < 5; gap += 1) {
      // The lower gaps run up to 300 ms behind, so the closed hold all share is 300…1000 ms.
      expect(choreography.opening(gap, 950)).toBe(0);
      expect(choreography.opening(gap, 3500)).toBe(1);
      expect(choreography.opening(gap, 7000 + 950)).toBe(0);
    }
  });

  it("opens the top gap first and the bottom gap last", () => {
    const time = 1800;
    const openings = [1, 2, 3, 4].map((gap) => choreography.opening(gap, time));
    expect(openings[3]).toBeGreaterThan(openings[2]);
    expect(openings[2]).toBeGreaterThan(openings[1]);
    expect(openings[1]).toBeGreaterThan(openings[0]);
  });

  it("eases, leaving and arriving slowly", () => {
    const start = choreography.opening(4, 1000 + 20);
    const middle = choreography.opening(4, 2000 + 20) - choreography.opening(4, 2000);
    expect(start).toBeLessThan(0.001);
    expect(middle).toBeGreaterThan(start);
  });

  it("repeats every breath, and reads negative time from the end", () => {
    expect(choreography.opening(2, 1500 + 7000 * 3)).toBeCloseTo(choreography.opening(2, 1500), 12);
    expect(choreography.opening(2, -500)).toBeCloseTo(choreography.opening(2, 6500), 12);
  });

  it("keeps the layers in order, never closer than the closed gap nor wider than the open one", () => {
    for (let time = 0; time < 7000; time += 37) {
      for (let layer = 1; layer < 5; layer += 1) {
        const gap = choreography.lift(layer, time) - choreography.lift(layer - 1, time);
        expect(gap).toBeGreaterThanOrEqual(0.1 - 1e-9);
        expect(gap).toBeLessThanOrEqual(0.8 + 1e-9);
      }
    }
  });

  it("keeps the stack centred on the origin as it breathes", () => {
    for (const time of [0, 1500, 2500, 3500, 5500]) {
      const bottom = choreography.lift(0, time);
      const top = choreography.lift(4, time);
      expect(bottom + top).toBeCloseTo(0, 12);
    }
    expect(choreography.lift(4, 3500)).toBeCloseTo(choreography.reach(), 12);
    expect(choreography.reach()).toBeCloseTo(1.6, 12);
  });

  it("has a still moment when every gap is fully open and the sway is at rest", () => {
    const still = choreography.stillMs();
    for (let gap = 1; gap < 5; gap += 1) {
      expect(choreography.opening(gap, still)).toBe(1);
    }
    expect(choreography.sway(still)).toBeCloseTo(0, 12);
  });

  it("sways slowly either side, never past its reach", () => {
    const still = choreography.stillMs();
    expect(choreography.sway(still + 4000)).toBeCloseTo(0.14, 12);
    expect(choreography.sway(still + 12000)).toBeCloseTo(-0.14, 12);
    for (let time = 0; time < 16000; time += 250) {
      expect(Math.abs(choreography.sway(time))).toBeLessThanOrEqual(0.14 + 1e-12);
    }
    expect(choreography.swayReach()).toBe(0.14);
  });

  it("shows a label only as its layer nears fully open", () => {
    expect(choreography.labelOpacity(3, 0)).toBe(0);
    expect(choreography.labelOpacity(3, choreography.stillMs())).toBe(1);
    expect(choreography.labelOpacity(0, choreography.stillMs())).toBe(1);
    expect(choreography.openness(0, 1800)).toBe(choreography.opening(1, 1800));
  });

  it("spreads each ripple ring from small to full while it fades, rings out of step", () => {
    expect(choreography.ripples()).toBe(2);
    expect(choreography.rippleScale(0, 0)).toBeCloseTo(0.3, 12);
    expect(choreography.rippleScale(0, 1999)).toBeGreaterThan(0.99);
    expect(choreography.rippleOpacity(0, 0)).toBeCloseTo(0.85, 12);
    expect(choreography.rippleOpacity(0, 1999)).toBeLessThan(0.001);
    expect(choreography.rippleScale(1, 0)).toBeCloseTo(choreography.rippleScale(0, 1000), 12);
  });

  it("refuses beats that never end, too few layers, gaps that do not open and a stagger that outlasts the hold", () => {
    expect(() => make({ openMs: 0 })).toThrow();
    expect(() => make({ swayMs: Number.POSITIVE_INFINITY })).toThrow();
    expect(() => make({}, { layers: 1 })).toThrow();
    expect(() => make({}, { explodedGap: 0.1 })).toThrow();
    expect(() => make({ staggerMs: 700 })).toThrow();
    expect(() => make({}, { ripples: 0 })).toThrow();
  });
});
