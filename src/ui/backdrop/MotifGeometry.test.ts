import { describe, expect, it } from "vitest";
import { cubicPath, insetSegment, midpointOf, pointOnCubic, segmentPath, strandField, type Cubic } from "./MotifGeometry";

const CURVE: Cubic = { from: { x: 224, y: 114 }, c1: { x: 236, y: 114 }, c2: { x: 235, y: 90 }, to: { x: 247, y: 90 } };

describe("pointOnCubic", () => {
  it("starts and ends on the curve's end points", () => {
    expect(pointOnCubic(CURVE, 0)).toEqual(CURVE.from);
    expect(pointOnCubic(CURVE, 1)).toEqual(CURVE.to);
  });

  it("finds the middle of the node-graph edge", () => {
    expect(pointOnCubic(CURVE, 0.5)).toEqual({ x: 235.5, y: 102 });
  });
});

describe("path data", () => {
  it("writes a cubic and a segment", () => {
    expect(cubicPath(CURVE)).toBe("M224 114 C236 114 235 90 247 90");
    expect(segmentPath({ from: { x: 0, y: 0 }, to: { x: 10, y: 5 } })).toBe("M0 0 L10 5");
  });
});

describe("insetSegment", () => {
  it("shortens both ends along the link", () => {
    expect(insetSegment({ x: 0, y: 0 }, { x: 100, y: 0 }, 20)).toEqual({ from: { x: 20, y: 0 }, to: { x: 80, y: 0 } });
    expect(insetSegment({ x: 0, y: 0 }, { x: 30, y: 40 }, 5)).toEqual({ from: { x: 3, y: 4 }, to: { x: 27, y: 36 } });
  });

  it("collapses to the midpoint when the inset eats the whole link", () => {
    const middle = { x: 5, y: 0 };
    expect(insetSegment({ x: 0, y: 0 }, { x: 10, y: 0 }, 8)).toEqual({ from: middle, to: middle });
  });

  it("puts the midpoint halfway", () => {
    expect(midpointOf({ from: { x: 20, y: 0 }, to: { x: 80, y: 40 } })).toEqual({ x: 50, y: 20 });
  });
});

describe("strandField", () => {
  const strands = strandField(18, 800, 600);

  it("draws the requested number of strands across the whole field", () => {
    expect(strands).toHaveLength(18);
    for (const strand of strands) {
      expect(strand.from.x).toBeLessThan(0);
      expect(strand.to.x).toBeGreaterThan(800);
    }
  });

  it("stacks the strands top to bottom where they enter", () => {
    const entries = strands.map((strand) => strand.from.y);
    expect(entries).toEqual([...entries].sort((a, b) => a - b));
  });

  it("pinches them together in the middle", () => {
    const range = (values: readonly number[]): number => Math.max(...values) - Math.min(...values);
    const edge = range(strands.map((strand) => strand.from.y));
    const waist = range(strands.map((strand) => pointOnCubic(strand, 0.55).y));
    expect(waist).toBeLessThan(edge / 2);
  });

  it("is deterministic, so server and client draw the same field", () => {
    expect(strandField(18, 800, 600)).toEqual(strands);
  });

  it("rejects an empty field", () => {
    expect(() => strandField(0, 800, 600)).toThrow(RangeError);
  });
});
