import { describe, expect, it } from "vitest";
import { Progress } from "@/story";
import { FramePosition } from "./FramePosition";

describe("FramePosition", () => {
  it("maps progress across every frame", () => {
    expect(FramePosition.fromProgress(Progress.START, 145).toNumber()).toBe(0);
    expect(FramePosition.fromProgress(Progress.END, 145).toNumber()).toBe(144);
    expect(FramePosition.fromProgress(Progress.of(0.5), 145).toNumber()).toBe(72);
  });

  it("splits a fractional position into floor, next and mix", () => {
    const position = new FramePosition(10.25, 145);
    expect(position.floorIndex()).toBe(10);
    expect(position.nextIndex()).toBe(11);
    expect(position.mix()).toBeCloseTo(0.25);
  });

  it("has no mix on an exact frame", () => {
    const position = new FramePosition(7, 145);
    expect(position.floorIndex()).toBe(7);
    expect(position.mix()).toBe(0);
  });

  it("clamps at the start", () => {
    const position = new FramePosition(-3, 145);
    expect(position.toNumber()).toBe(0);
    expect(position.floorIndex()).toBe(0);
    expect(position.nextIndex()).toBe(1);
  });

  it("clamps at the end, where there is no next frame to blend", () => {
    const position = new FramePosition(500, 145);
    expect(position.floorIndex()).toBe(144);
    expect(position.nextIndex()).toBe(144);
    expect(position.mix()).toBe(0);
  });

  it("handles a single-frame sequence", () => {
    const position = new FramePosition(0.7, 1);
    expect(position.floorIndex()).toBe(0);
    expect(position.nextIndex()).toBe(0);
    expect(position.mix()).toBe(0);
  });

  it("rejects an empty sequence and non-finite positions", () => {
    expect(() => new FramePosition(0, 0)).toThrow(RangeError);
    expect(() => new FramePosition(Number.NaN, 10)).toThrow(RangeError);
  });
});
