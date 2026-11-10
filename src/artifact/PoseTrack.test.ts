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
    expect(sample(wide, 0)).toEqual({ x: 0.74, y: 0.5, scale: 0.85, assembly: 0, spin: 0 });
    expect(sample(wide, 2)).toEqual({ x: 0.86, y: 0.46, scale: 0.72, assembly: 0.68, spin: 1.5 });
    expect(sample(wide, 4)).toEqual({ x: 0.76, y: 0.47, scale: 1.05, assembly: 1, spin: 3.1 });
  });

  it("is halfway between two chapters at their midpoint (smoothstep is symmetric)", () => {
    const mid = sample(wide, 0.5);
    expect(mid.assembly).toBeCloseTo((0 + 0.35) / 2, 10);
    expect(mid.x).toBeCloseTo((0.74 + 0.77) / 2, 10);
    expect(mid.spin).toBeCloseTo(0.35, 10);
  });

  it("eases rather than interpolating linearly", () => {
    expect(sample(wide, 0.25).assembly).toBeLessThan(0.35 * 0.25);
  });

  it("chooses the narrow table below 1024 px and the wide one from 1024", () => {
    const narrow = sample(PoseTrack.forCanvasWidth(NARROW_BELOW_PX - 1), 2);
    expect(narrow).toEqual({ x: 0.5, y: 0.26, scale: 0.72 * 0.62, assembly: 0.68, spin: 1.5 });
    expect(sample(PoseTrack.forCanvasWidth(NARROW_BELOW_PX), 2)).toEqual(sample(wide, 2));
  });
});

describe("PoseFollower", () => {
  it("snaps to the first target, then approaches later ones without overshooting", () => {
    const follower = new PoseFollower(4);
    follower.follow({ x: 0.5, y: 0.5, scale: 1, assembly: 0, spin: 0 }, 0.016);
    expect(follower.values().x).toBe(0.5);
    follower.follow({ x: 1, y: 0.5, scale: 1, assembly: 0, spin: 0 }, 0.1);
    expect(follower.values().x).toBeGreaterThan(0.5);
    expect(follower.values().x).toBeLessThan(1);
  });
});

describe("StageLayout", () => {
  const layout = new StageLayout();
  const pose: PoseValues = { x: 0.72, y: 0.25, scale: 1, assembly: 0, spin: 0 };

  it("converts anchors to world units around the centre", () => {
    const out = { x: 0, y: 0, scale: 0 };
    layout.place(10, 6, pose, out);
    expect(out.x).toBeCloseTo(2.2, 10);
    expect(out.y).toBeCloseTo(1.5, 10);
  });

  it("sizes the diameter to 42% of the height on a wide screen", () => {
    expect(StageLayout.unitRadius(16, 6) * 2).toBeCloseTo(6 * 0.42, 10);
  });

  it("never exceeds 70% of the width on a tall screen", () => {
    expect(StageLayout.unitRadius(2, 8) * 2).toBeCloseTo(2 * 0.7, 10);
  });
});
