import { describe, expect, it } from "vitest";
import { FrameSetSelector } from "./FrameSetSelector";

const sets = [
  { width: 854, directory: "/backdrop/854" },
  { width: 1280, directory: "/backdrop/1280" },
  { width: 1920, directory: "/backdrop/1920" },
];

describe("FrameSetSelector", () => {
  const selector = new FrameSetSelector(sets);

  it("picks the smallest set that covers the pixel width", () => {
    expect(selector.indexFor(400, 2)).toBe(0);
    expect(selector.indexFor(640, 2)).toBe(1);
    expect(selector.indexFor(1000, 1)).toBe(1);
  });

  it("accepts a set exactly as wide as needed", () => {
    expect(selector.indexFor(854, 1)).toBe(0);
  });

  it("falls back to the largest set when none is wide enough", () => {
    expect(selector.indexFor(3000, 1)).toBe(2);
  });

  it("caps the device pixel ratio at 2", () => {
    expect(selector.indexFor(960, 3)).toBe(2);
    expect(selector.indexFor(960, 2)).toBe(2);
    expect(selector.indexFor(640, 3)).toBe(1);
  });

  it("works with a single set", () => {
    const single = new FrameSetSelector([sets[0]]);
    expect(single.indexFor(2000, 2)).toBe(0);
    expect(single.setAt(0).directory).toBe("/backdrop/854");
  });

  it("rejects empty or unordered lists", () => {
    expect(() => new FrameSetSelector([])).toThrow(RangeError);
    expect(() => new FrameSetSelector([sets[1], sets[0]])).toThrow(RangeError);
  });
});
