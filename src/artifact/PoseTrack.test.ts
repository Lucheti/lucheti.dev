import { describe, expect, it } from "vitest";
import { ChapterPosition } from "@/story";
import { NARROW_BELOW_PX, PoseFollower, PoseTrack, StageLayout, type PoseValues } from "./PoseTrack";

function sample(track: PoseTrack, continuous: number): PoseValues {
  const out: PoseValues = { x: 0, y: 0, scale: 0, assembly: 0, spin: 0 };
  track.sample(ChapterPosition.at(continuous), out);
  return out;
}

describe("PoseTrack", () => {
  const wide = PoseTrack.wide();

  it("returns the chapter pose exactly at each boundary", () => {
    expect(sample(wide, 0).assembly).toBe(0);
    expect(sample(wide, 5)).toEqual({ x: 0.78, y: 0.5, scale: 0.9, assembly: 1, spin: 3.4 });
  });

  it("folds away in every chapter between the hero and contact", () => {
    for (const chapter of [1, 2, 3, 4]) {
      expect(sample(wide, chapter).scale).toBe(0);
    }
  });

  it("is halfway between two chapters at their midpoint (smoothstep is symmetric)", () => {
    const mid = sample(wide, 3.5);
    expect(mid.spin).toBeCloseTo((2.0 + 2.6) / 2, 10);
    expect(mid.x).toBeCloseTo((0.8 + 0.78) / 2, 10);
  });

  it("unfolds only in the last stretch before a chapter that shows it", () => {
    expect(sample(wide, 4.6).scale).toBe(0);
    expect(sample(wide, 4.85).scale).toBeGreaterThan(0.3);
    expect(sample(wide, 4.85).scale).toBeLessThan(0.9);
  });

  it("folds away in the first stretch after a chapter that shows it", () => {
    expect(sample(wide, 0.15).scale).toBeGreaterThan(0);
    expect(sample(wide, 0.4).scale).toBe(0);
  });

  it("chooses the narrow table below 1024 px and the wide one from 1024", () => {
    expect(sample(PoseTrack.forCanvasWidth(NARROW_BELOW_PX - 1), 4).x).toBe(0.76);
    expect(sample(PoseTrack.forCanvasWidth(NARROW_BELOW_PX - 1), 0).scale).toBe(0);
    expect(sample(PoseTrack.forCanvasWidth(NARROW_BELOW_PX), 5)).toEqual(sample(wide, 5));
  });
});

describe("PoseFollower", () => {
  it("snaps to the first target, then approaches later ones without overshooting", () => {
    const follower = new PoseFollower(4);
    follower.follow({ x: 0.2, y: 0.3, scale: 1, assembly: 0, spin: 0 }, 0.016);
    expect(follower.values().x).toBe(0.2);
    follower.follow({ x: 0.8, y: 0.3, scale: 1, assembly: 1, spin: 0 }, 0.1);
    const x = follower.values().x;
    expect(x).toBeGreaterThan(0.2);
    expect(x).toBeLessThan(0.8);
  });
});

describe("StageLayout", () => {
  it("sizes the object by viewport height, capped by width", () => {
    expect(StageLayout.unitRadius(20, 10)).toBeCloseTo(2.1, 10);
    expect(StageLayout.unitRadius(4, 10)).toBeCloseTo(1.4, 10);
  });
});
