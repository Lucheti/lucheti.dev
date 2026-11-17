import { describe, expect, it } from "vitest";
import { circle, grow, placed, roundedBox } from "./outline";

const BOX = { left: -1, top: -0.5, right: 1, bottom: 0.5 };

describe("outline", () => {
  it("rounds a box's corners within its edges, touching every edge", () => {
    const loop = roundedBox(BOX, 0.2);
    const us = loop.map((point) => point.u);
    const vs = loop.map((point) => point.v);
    expect(Math.min(...us)).toBeCloseTo(-1, 12);
    expect(Math.max(...us)).toBeCloseTo(1, 12);
    expect(Math.min(...vs)).toBeCloseTo(-0.5, 12);
    expect(Math.max(...vs)).toBeCloseTo(0.5, 12);
    expect(loop.every((point) => Math.hypot(point.u, point.v) <= Math.hypot(1, 0.5))).toBe(true);
  });

  it("cuts the corners: no point sits in the square corner beyond the curve", () => {
    const loop = roundedBox(BOX, 0.2);
    const inCorner = loop.filter((point) => point.u > 0.95 && point.v > 0.45);
    expect(inCorner).toHaveLength(0);
  });

  it("keeps a sharp box to its four corners", () => {
    expect(roundedBox(BOX, 0)).toHaveLength(4);
  });

  it("makes a pill of a radius too large, without doubled points", () => {
    const pill = roundedBox(BOX, 5);
    for (let index = 0; index < pill.length; index += 1) {
      const next = pill[(index + 1) % pill.length];
      expect(Math.hypot(next.u - pill[index].u, next.v - pill[index].v)).toBeGreaterThan(1e-9);
    }
    expect(Math.min(...pill.map((point) => point.v))).toBeCloseTo(-0.5, 12);
  });

  it("refuses an empty box and a circle with no radius", () => {
    expect(() => roundedBox({ left: 0, top: 0, right: 0, bottom: 1 }, 0)).toThrow();
    expect(() => circle({ u: 0, v: 0 }, 0)).toThrow();
  });

  it("draws a circle at its radius", () => {
    const loop = circle({ u: 1, v: 2 }, 0.5);
    expect(loop.length).toBeGreaterThan(16);
    for (const point of loop) {
      expect(Math.hypot(point.u - 1, point.v - 2)).toBeCloseTo(0.5, 12);
    }
  });

  it("grows a box on every side and places a shape by its origin", () => {
    expect(grow(BOX, 0.1)).toEqual({ left: -1.1, top: -0.6, right: 1.1, bottom: 0.6 });
    expect(placed([[0, 0], [1, 2]], { u: 3, v: 4 }, 0.5)).toEqual([{ u: 3, v: 4 }, { u: 3.5, v: 5 }]);
  });
});
