import { describe, expect, it } from "vitest";
import { LoopTimeline } from "./LoopTimeline";

describe("LoopTimeline", () => {
  const timeline = new LoopTimeline([1000, 500, 2500]);

  it("adds the beats into one pass", () => {
    expect(timeline.duration()).toBe(4000);
  });

  it("finds the beat playing, with each boundary opening the next beat", () => {
    expect(timeline.beatAt(0)).toBe(0);
    expect(timeline.beatAt(999)).toBe(0);
    expect(timeline.beatAt(1000)).toBe(1);
    expect(timeline.beatAt(1499)).toBe(1);
    expect(timeline.beatAt(1500)).toBe(2);
    expect(timeline.beatAt(3999)).toBe(2);
  });

  it("starts over after one pass, and reads negative time from the end", () => {
    expect(timeline.beatAt(4000)).toBe(0);
    expect(timeline.beatAt(9200)).toBe(1);
    expect(timeline.beatAt(-1)).toBe(2);
  });

  it("measures progress within the current beat", () => {
    expect(timeline.progressAt(0)).toBe(0);
    expect(timeline.progressAt(500)).toBe(0.5);
    expect(timeline.progressAt(1250)).toBe(0.5);
    expect(timeline.progressAt(1500 + 625)).toBe(0.25);
    expect(timeline.progressAt(4500)).toBe(0.5);
  });

  it("refuses an empty loop and beats that never end or never start", () => {
    expect(() => new LoopTimeline([])).toThrow();
    expect(() => new LoopTimeline([1000, 0])).toThrow();
    expect(() => new LoopTimeline([-5])).toThrow();
    expect(() => new LoopTimeline([Number.POSITIVE_INFINITY])).toThrow();
  });
});
