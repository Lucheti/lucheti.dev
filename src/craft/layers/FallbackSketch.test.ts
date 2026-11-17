import { describe, expect, it } from "vitest";
import { composeLayersToy } from "./composeLayersToy";
import { FallbackSketch } from "./FallbackSketch";
import { TONES } from "./palette";

describe("FallbackSketch", () => {
  const toy = composeLayersToy();
  const size = { width: 700, height: 320 };
  const shapes = toy.sketch.draw(toy.stage.fit(size));

  it("draws one soft shadow under the stack, first", () => {
    const shadows = shapes.filter((shape) => shape.kind === "shadow");
    expect(shadows).toHaveLength(1);
    expect(shapes[0].kind).toBe("shadow");
  });

  it("draws every layer's slab: its walls, its face and the hairline round it", () => {
    const faces = shapes.filter((shape) => shape.kind === "area" && !shape.evenOdd);
    expect(faces).toHaveLength(5);
  });

  it("uses orange only after the last slab face, on the interaction layer", () => {
    const lastFace = shapes.reduce((last, shape, index) => (shape.kind === "area" && !shape.evenOdd ? index : last), -1);
    shapes.forEach((shape, index) => {
      if (shape.color === TONES.signal) {
        expect(index).toBeGreaterThan(lastFace);
      }
    });
    expect(shapes.some((shape) => shape.color === TONES.signal)).toBe(true);
  });

  it("stays inside the stage", () => {
    for (const shape of shapes) {
      const numbers = shape.d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
      for (let index = 0; index + 1 < numbers.length; index += 2) {
        expect(numbers[index]).toBeGreaterThanOrEqual(0);
        expect(numbers[index]).toBeLessThanOrEqual(size.width);
        expect(numbers[index + 1]).toBeGreaterThanOrEqual(0);
        expect(numbers[index + 1]).toBeLessThanOrEqual(size.height);
      }
    }
  });

  it("finds the convex hull of a set of points", () => {
    const hull = FallbackSketch.hull([
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 0, y: 2 },
    ]);
    expect(hull).toHaveLength(4);
    expect(hull).not.toContainEqual({ x: 1, y: 1 });
  });
});
