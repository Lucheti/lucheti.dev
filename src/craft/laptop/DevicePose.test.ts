import { describe, expect, it } from "vitest";
import { HoverTilt } from "../layers/HoverTilt";
import { DevicePose } from "./DevicePose";
import { MenuClock } from "./MenuClock";

const makePose = (): DevicePose => new DevicePose(new HoverTilt(4), { x: 3, y: 9 }, 2.5);

describe("DevicePose", () => {
  it("holds the product-shot pose at rest", () => {
    const pose = makePose();
    expect(pose.pose()).toEqual({ rotateX: 3, rotateY: 9, glare: -0 });
    expect(pose.resting()).toBe(true);
  });

  it("turns toward the pointer, damped, never past its reach", () => {
    const pose = makePose();
    pose.aim(100, 0, 100, 100);
    pose.settle(0.1);
    const partway = pose.pose();
    expect(partway.rotateY).toBeGreaterThan(9);
    expect(partway.rotateY).toBeLessThan(11.5);
    expect(partway.rotateX).toBeGreaterThan(3);
    expect(pose.resting()).toBe(false);

    pose.settle(100);
    expect(pose.pose().rotateY).toBeCloseTo(11.5, 5);
    expect(pose.pose().rotateX).toBeCloseTo(5.5, 5);
    expect(pose.pose().glare).toBeCloseTo(-1, 5);
  });

  it("eases back to rest after the pointer leaves", () => {
    const pose = makePose();
    pose.aim(0, 100, 100, 100);
    pose.settle(100);
    pose.release();
    expect(pose.resting()).toBe(false);
    pose.settle(100);
    expect(pose.resting()).toBe(true);
    expect(pose.pose().rotateY).toBeCloseTo(9, 5);
  });

  it("refuses a negative reach", () => {
    expect(() => new DevicePose(new HoverTilt(4), { x: 0, y: 0 }, -1)).toThrow();
  });
});

describe("MenuClock", () => {
  it("reads the date and time the way the macOS menu bar writes them", () => {
    const clock = new MenuClock("UTC");
    expect(clock.read(new Date(Date.UTC(2026, 10, 17, 9, 41)))).toEqual({ date: "Tue Nov 17", hours: "9", minutes: "41", period: "AM" });
    expect(clock.read(new Date(Date.UTC(2026, 10, 17, 21, 5)))).toMatchObject({ hours: "9", minutes: "05", period: "PM" });
  });
});
