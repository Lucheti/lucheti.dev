import { describe, expect, it } from "vitest";
import { CardBlueprint, LAYER_ORDER, type Mark } from "./CardBlueprint";
import type { CardPoint } from "./outline";

function pointsOf(mark: Mark): readonly CardPoint[] {
  switch (mark.kind) {
    case "fill":
      return [...mark.outline, ...(mark.hole ?? [])];
    case "stroke":
      return mark.path;
    case "ripple":
      return [
        { u: mark.centre.u - mark.radius, v: mark.centre.v - mark.radius },
        { u: mark.centre.u + mark.radius, v: mark.centre.v + mark.radius },
      ];
  }
}

function toneOf(mark: Mark): string {
  return mark.tone;
}

describe("CardBlueprint", () => {
  const blueprint = new CardBlueprint();

  it("stacks the five layers bottom to top: tokens, layout, components, content, interaction", () => {
    expect(blueprint.layers().map((layer) => layer.kind)).toEqual(LAYER_ORDER);
    expect(LAYER_ORDER).toEqual(["tokens", "layout", "components", "content", "interaction"]);
  });

  it("makes the ground slab solid and the four above it glass, all thin", () => {
    const [ground, ...rest] = blueprint.layers();
    expect(ground.surface).toBe("solid");
    expect(rest.every((layer) => layer.surface === "glass")).toBe(true);
    for (const layer of blueprint.layers()) {
      expect(layer.thickness).toBeGreaterThan(0);
      expect(layer.thickness).toBeLessThan(0.1);
    }
    expect(blueprint.maxThickness()).toBe(ground.thickness);
  });

  it("draws something on every layer, and keeps every mark inside the card", () => {
    const { left, top, right, bottom } = blueprint.bounds();
    for (const layer of blueprint.layers()) {
      expect(layer.marks.length).toBeGreaterThan(0);
      for (const mark of layer.marks) {
        for (const point of pointsOf(mark)) {
          expect(point.u).toBeGreaterThanOrEqual(left);
          expect(point.u).toBeLessThanOrEqual(right);
          expect(point.v).toBeGreaterThanOrEqual(top);
          expect(point.v).toBeLessThanOrEqual(bottom);
        }
      }
    }
  });

  it("keeps orange for the interaction layer alone, where it marks the focus ring and the ripple", () => {
    for (const layer of blueprint.layers()) {
      const orange = layer.marks.filter((mark) => toneOf(mark) === "signal");
      if (layer.kind === "interaction") {
        expect(orange.map((mark) => mark.kind).sort()).toEqual(["fill", "ripple"]);
      } else {
        expect(orange).toHaveLength(0);
      }
    }
  });

  it("draws the layout as hairlines only, and the components and content as fills", () => {
    const [, layout, components, content] = blueprint.layers();
    expect(layout.marks.every((mark) => mark.kind === "stroke")).toBe(true);
    expect(components.marks.every((mark) => mark.kind === "fill")).toBe(true);
    expect(content.marks.every((mark) => mark.kind === "fill")).toBe(true);
  });

  it("pins labels on the top-right corner's curve, inside the card's square corner", () => {
    const corner = blueprint.labelCorner();
    const { right, top } = blueprint.bounds();
    expect(corner.u).toBeLessThan(right);
    expect(corner.v).toBeGreaterThan(top);
    const { radius } = blueprint.footprint();
    expect(Math.hypot(corner.u - (right - radius), corner.v - (top + radius))).toBeCloseTo(radius, 12);
  });

  it("outlines the slab on the card's footprint", () => {
    const { width, depth } = blueprint.footprint();
    const us = blueprint.slab().map((point) => point.u);
    const vs = blueprint.slab().map((point) => point.v);
    expect(Math.max(...us) - Math.min(...us)).toBeCloseTo(width, 12);
    expect(Math.max(...vs) - Math.min(...vs)).toBeCloseTo(depth, 12);
  });
});
