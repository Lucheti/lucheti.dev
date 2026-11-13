import { describe, expect, it } from "vitest";
import type { DepartmentId } from "@/content";
import { aroundBorder, BoardGeometry, channelBetween, type Box } from "./BoardGeometry";
import { Polyline, type PointSlot } from "./Polyline";

const left: Box = { x: 0, y: 0, width: 200, height: 100 };
const tall: Box = { x: 240, y: 0, width: 200, height: 240 };
const belowTall: Box = { x: 240, y: 270, width: 200, height: 80 };
const farCorner: Box = { x: 480, y: 400, width: 100, height: 50 };

describe("channelBetween", () => {
  it("runs straight across the gutter through the middle of the shared height", () => {
    expect(channelBetween(left, tall)).toEqual([
      { x: 200, y: 50 },
      { x: 240, y: 50 },
    ]);
  });

  it("is the same line walked backwards from the other side", () => {
    expect(channelBetween(tall, left)).toEqual([
      { x: 240, y: 50 },
      { x: 200, y: 50 },
    ]);
  });

  it("runs down the gutter between stacked boxes", () => {
    expect(channelBetween(tall, belowTall)).toEqual([
      { x: 340, y: 240 },
      { x: 340, y: 270 },
    ]);
  });

  it("bends once between boxes that share no side", () => {
    expect(channelBetween(left, farCorner)).toEqual([
      { x: 200, y: 50 },
      { x: 530, y: 50 },
      { x: 530, y: 400 },
    ]);
  });
});

describe("aroundBorder", () => {
  it("takes the shorter way round, through the corners it passes", () => {
    expect(aroundBorder(left, { x: 156, y: 0 }, { x: 200, y: 50 })).toEqual([
      { x: 200, y: 0 },
      { x: 200, y: 50 },
    ]);
  });

  it("goes counter-clockwise when that is shorter", () => {
    expect(aroundBorder(tall, { x: 240, y: 50 }, { x: 396, y: 0 })).toEqual([
      { x: 240, y: 0 },
      { x: 396, y: 0 },
    ]);
  });

  it("goes straight to a point on the same side", () => {
    expect(aroundBorder(left, { x: 20, y: 0 }, { x: 150, y: 0 })).toEqual([{ x: 150, y: 0 }]);
  });
});

describe("BoardGeometry", () => {
  const boxes = new Map<DepartmentId, Box>([
    ["product", left],
    ["engineering", tall],
    ["qa", belowTall],
  ]);
  const geometry = new BoardGeometry(boxes);

  it("docks the ticket on the top border near the right", () => {
    expect(geometry.dock("product")).toEqual({ x: 156, y: 0 });
  });

  it("routes a handoff along hairlines only, dock to dock", () => {
    expect(geometry.leg("product", "engineering").vertices()).toEqual([
      { x: 156, y: 0 },
      { x: 200, y: 0 },
      { x: 200, y: 50 },
      { x: 240, y: 50 },
      { x: 240, y: 0 },
      { x: 396, y: 0 },
    ]);
  });

  it("throws for a department it has no box for", () => {
    expect(() => geometry.dock("learning")).toThrow(RangeError);
  });
});

describe("Polyline", () => {
  const line = new Polyline([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
  ]);
  const out: PointSlot = { x: Number.NaN, y: Number.NaN };

  it("measures its length", () => {
    expect(line.length()).toBe(200);
  });

  it("locates points by fraction of its length", () => {
    line.locate(0.25, out);
    expect(out).toEqual({ x: 50, y: 0 });
    line.locate(0.75, out);
    expect(out).toEqual({ x: 100, y: 50 });
  });

  it("clamps to its ends", () => {
    line.locate(-1, out);
    expect(out).toEqual({ x: 0, y: 0 });
    line.locate(2, out);
    expect(out).toEqual({ x: 100, y: 100 });
  });

  it("treats a single point as a path that never moves", () => {
    new Polyline([{ x: 3, y: 4 }]).locate(0.5, out);
    expect(out).toEqual({ x: 3, y: 4 });
  });
});
