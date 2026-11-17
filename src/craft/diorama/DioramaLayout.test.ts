import { describe, expect, it } from "vitest";
import { DioramaLayout } from "./DioramaLayout";
import { solidExtent, unionExtent } from "./Solid";
import { contains, point } from "./space";
import { allTargets, targetKey } from "./Target";

const layout = new DioramaLayout();
const half = layout.half();

describe("DioramaLayout", () => {
  it("keeps every solid over the island's footprint", () => {
    for (const solid of layout.solids()) {
      const { min, max } = solidExtent(solid);
      expect(min.x).toBeGreaterThanOrEqual(-half - 0.05);
      expect(max.x).toBeLessThanOrEqual(half + 0.05);
      expect(min.z).toBeGreaterThanOrEqual(-half - 0.05);
      expect(max.z).toBeLessThanOrEqual(half + 0.05);
      expect(min.y).toBeGreaterThanOrEqual(layout.bottom() - 1e-9);
    }
  });

  it("rests the desk's props on the desk top", () => {
    for (const part of ["keyboard", "mug", "monitor"] as const) {
      const bottom = unionExtent(layout.part(part).map(solidExtent)).min.y;
      expect(bottom).toBeCloseTo(layout.deskTop(), 2);
    }
    expect(layout.piece("duck").pivot.y).toBe(layout.deskTop());
    expect(layout.piece("lamp-stand").pivot.y).toBeGreaterThanOrEqual(layout.deskTop());
  });

  it("stands the pegboard's controls out from the board, never behind it", () => {
    const board = unionExtent(layout.part("pegboard").map(solidExtent));
    // Stars are measured by the sphere round them, which is looser than their shape; the rest exactly.
    for (const solid of layout.part("control").filter((control) => control.kind !== "star")) {
      expect(solidExtent(solid).min.z).toBeGreaterThanOrEqual(board.min.z);
    }
  });

  it("gives every piece its own id, and tints only the toggle's knob and the stars", () => {
    const ids = layout.pieces().map((piece) => piece.id);
    expect(new Set(ids).size).toBe(ids.length);
    const tinted = layout.pieces().filter((piece) => piece.tinted).map((piece) => piece.id);
    expect(tinted.sort()).toEqual(["star-1", "star-2", "star-3", "star-4", "star-5", "toggle-knob"]);
  });

  it("has one hit box for every target but the floating card, which brings its own", () => {
    const keys = layout.hits().map((hit) => targetKey(hit.target));
    const wanted = allTargets()
      .filter((target) => target.kind !== "card")
      .map(targetKey);
    expect(keys.sort()).toEqual(wanted.sort());
  });

  it("makes each hit box hold the pieces that answer to it", () => {
    for (const hit of layout.hits()) {
      const pieces = layout.pieces().filter((piece) => piece.target !== null && targetKey(piece.target) === targetKey(hit.target));
      for (const piece of pieces) {
        expect(contains(hit.extent, unionExtent(piece.solids.map(solidExtent)))).toBe(true);
      }
    }
  });

  it("lays the screen on the monitor's face and scales its interface to fill it", () => {
    const screen = layout.screen();
    const face = unionExtent(layout.part("monitor").filter((solid) => solid.tone === "screen").map(solidExtent));
    expect(screen.centre.z).toBeGreaterThan(face.max.z);
    expect(screen.centre.z).toBeLessThan(face.max.z + 0.01);
    expect(screen.centre.x).toBeCloseTo((face.min.x + face.max.x) / 2, 9);
    expect(screen.width).toBeCloseTo(face.max.x - face.min.x, 9);
    expect((screen.pixels.width * layout.screenDistanceFactor()) / 400).toBeCloseTo(screen.width, 9);
    expect(screen.width / screen.height).toBeCloseTo(screen.pixels.width / screen.pixels.height, 1);
  });

  it("includes the floating card at its widest in the island's extent", () => {
    const card = layout.card();
    const box = { min: point(card.at.x - card.reach, card.at.y - card.reach, card.at.z - card.reach), max: point(card.at.x + card.reach, card.at.y + card.reach, card.at.z + card.reach) };
    expect(contains(layout.extent(), box)).toBe(true);
  });

  it("aims the lamp down at the desk, and sets the slider's stops left to right", () => {
    const lamp = layout.lamp();
    expect(lamp.bulb.y).toBeGreaterThan(lamp.aim.y);
    expect(lamp.aim.y).toBe(layout.deskTop());
    const stops = layout.sliderStops();
    expect([...stops].sort((a, b) => a - b)).toEqual(stops);
  });

  it("refuses a piece it does not have", () => {
    expect(() => layout.piece("nope" as never)).toThrow();
  });
});
