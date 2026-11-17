import { describe, expect, it } from "vitest";
import { DiffusionSchedule } from "./DiffusionSchedule";

describe("DiffusionSchedule", () => {
  const schedule = new DiffusionSchedule(20, 4000);

  it("starts as pure noise and ends as a clean picture", () => {
    expect(schedule.noiseAt(0)).toBe(1);
    expect(schedule.noiseAt(1)).toBeCloseTo(0, 10);
  });

  it("never lets the noise grow back", () => {
    let previous = schedule.noiseAt(0);
    for (let i = 1; i <= 200; i += 1) {
      const noise = schedule.noiseAt(i / 200);
      expect(noise).toBeLessThanOrEqual(previous);
      previous = noise;
    }
  });

  it("lingers on noise early and resolves quickly late", () => {
    expect(schedule.noiseAt(0.25)).toBeGreaterThan(0.8);
    expect(schedule.noiseAt(0.75)).toBeLessThan(0.2);
  });

  it("clamps progress outside a run", () => {
    expect(schedule.noiseAt(-3)).toBe(1);
    expect(schedule.noiseAt(7)).toBeCloseTo(0, 10);
    expect(schedule.progressAt(-5)).toBe(0);
    expect(schedule.progressAt(9999)).toBe(1);
  });

  it("maps elapsed time to progress", () => {
    expect(schedule.progressAt(2000)).toBe(0.5);
    expect(schedule.duration()).toBe(4000);
  });

  it("counts steps from 0 to the total and never beyond", () => {
    expect(schedule.stepCount()).toBe(20);
    expect(schedule.stepAt(0)).toBe(0);
    expect(schedule.stepAt(0.5)).toBe(10);
    expect(schedule.stepAt(0.999)).toBe(19);
    expect(schedule.stepAt(1)).toBe(20);
    expect(schedule.stepAt(4)).toBe(20);
  });

  it("reports the noise left after a whole step", () => {
    expect(schedule.noiseAfterStep(0)).toBe(1);
    expect(schedule.noiseAfterStep(20)).toBeCloseTo(0, 10);
    expect(schedule.noiseAfterStep(10)).toBeCloseTo(0.5, 10);
    expect(schedule.noiseAfterStep(99)).toBeCloseTo(0, 10);
  });

  it("scales blur with the noise", () => {
    expect(schedule.softnessAt(1, 8)).toBe(8);
    expect(schedule.softnessAt(0.5, 8)).toBe(4);
    expect(schedule.softnessAt(0, 8)).toBe(0);
  });

  it("rejects schedules that cannot run", () => {
    expect(() => new DiffusionSchedule(0, 1000)).toThrow();
    expect(() => new DiffusionSchedule(2.5, 1000)).toThrow();
    expect(() => new DiffusionSchedule(5, 0)).toThrow();
  });
});
