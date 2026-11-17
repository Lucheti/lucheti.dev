import { describe, expect, it } from "vitest";
import { solidExtent, type ClaySolid, type RoomPart } from "./ClaySolid";
import { pointing, RoomLayout } from "./RoomLayout";
import { length, minus, point, unit } from "./space";

const layout = new RoomLayout();
const WALL_FACE = -2.84;
const ON_WALLS: readonly RoomPart[] = ["wall", "pegboard", "tile", "shelf", "poster"];

function lowest(solids: readonly ClaySolid[]): number {
  return Math.min(...solids.map((solid) => solidExtent(solid).min.y));
}

const plinth = solidExtent(layout.part("plinth")[0]);

describe("RoomLayout", () => {
  it("keeps everything on the plinth's footprint and above its underside", () => {
    for (const solid of layout.solids()) {
      const { min, max } = solidExtent(solid);
      expect(min.x, solid.part).toBeGreaterThanOrEqual(plinth.min.x - 1e-9);
      expect(max.x, solid.part).toBeLessThanOrEqual(plinth.max.x + 1e-9);
      expect(min.z, solid.part).toBeGreaterThanOrEqual(plinth.min.z - 1e-9);
      expect(max.z, solid.part).toBeLessThanOrEqual(plinth.max.z + 1e-9);
      expect(min.y, solid.part).toBeGreaterThanOrEqual(plinth.min.y - 1e-9);
    }
  });

  it("keeps the furniture in front of the walls", () => {
    for (const solid of layout.solids().filter((s) => !ON_WALLS.includes(s.part) && s.part !== "plinth")) {
      const { min } = solidExtent(solid);
      expect(min.x, `${solid.part} pokes into the left wall`).toBeGreaterThanOrEqual(WALL_FACE);
      expect(min.z, `${solid.part} pokes into the back wall`).toBeGreaterThanOrEqual(WALL_FACE);
    }
  });

  it("stands the furniture on the floor", () => {
    for (const part of ["desk", "drawers", "chair", "rug", "fig"] as const) {
      expect(lowest(layout.part(part)), part).toBeCloseTo(0, 2);
    }
  });

  it("rests the desk props on the desk top, inside its edges", () => {
    const top = layout.deskTop();
    const desk = solidExtent(layout.part("desk").filter((solid) => solid.tone === "wood")[0]);
    expect(desk.max.y).toBeCloseTo(top, 6);
    for (const part of ["monitor", "keyboard", "mouse", "mug", "plant", "lamp"] as const) {
      const solids = layout.part(part);
      expect(lowest(solids), part).toBeCloseTo(top, 2);
      for (const solid of solids) {
        const { min, max } = solidExtent(solid);
        expect(min.x, part).toBeGreaterThanOrEqual(desk.min.x);
        expect(max.x, part).toBeLessThanOrEqual(desk.max.x);
        expect(min.z, part).toBeGreaterThanOrEqual(desk.min.z - 0.15);
        expect(max.z, part).toBeLessThanOrEqual(desk.max.z);
      }
    }
  });

  it("hangs the tiles on the board, standing out from it", () => {
    const board = solidExtent(layout.part("pegboard")[0]);
    for (const tile of layout.part("tile")) {
      const { min, max } = solidExtent(tile);
      expect(min.y).toBeGreaterThanOrEqual(board.min.y);
      expect(max.y).toBeLessThanOrEqual(board.max.y);
      expect(min.z).toBeGreaterThanOrEqual(board.min.z);
      expect(max.z).toBeLessThanOrEqual(board.max.z);
      expect(max.x).toBeGreaterThan(board.max.x);
    }
  });

  it("puts the screen on the monitor's face, 16:10, filled by its interface", () => {
    const screen = layout.screen();
    const panel = solidExtent(layout.part("monitor")[0]);
    expect(screen.centre.z).toBeGreaterThan(panel.max.z);
    expect(screen.centre.z - panel.max.z).toBeLessThan(0.005);
    expect(screen.width).toBeLessThan(panel.max.x - panel.min.x);
    expect(screen.height).toBeLessThan(panel.max.y - panel.min.y);
    expect(screen.width / screen.height).toBeCloseTo(screen.pixels.width / screen.pixels.height, 6);
    expect((screen.pixels.width * layout.screenDistanceFactor()) / 400).toBeCloseTo(screen.width, 9);
    expect(length(screen.normal)).toBeCloseTo(1, 9);
  });

  it("hangs the cards above the desk, beside the monitor and inside the room", () => {
    const monitor = solidExtent(layout.part("monitor")[0]);
    for (const card of layout.cards()) {
      // Half the card's diagonal, plus half the stack's depth when fully open.
      const reach = card.scale * Math.hypot(2.5, 3.5) * 0.5 + card.scale * 1.6;
      expect(card.at.y - reach).toBeGreaterThan(layout.deskTop() - 0.2);
      expect(card.at.x < monitor.min.x || card.at.x > monitor.max.x).toBe(true);
      expect(card.at.x - reach).toBeGreaterThan(WALL_FACE);
      expect(card.at.x + reach).toBeLessThan(plinth.max.x);
      expect(card.at.z - reach).toBeGreaterThan(WALL_FACE);
      expect(card.at.z + reach).toBeLessThan(plinth.max.z);
    }
  });

  it("aims the lamp down at the desk", () => {
    const { bulb, aim } = layout.lamp();
    expect(bulb.y).toBeGreaterThan(aim.y);
    expect(aim.y).toBeCloseTo(layout.deskTop(), 9);
  });

  it("measures the whole room from its solids", () => {
    const { min, max } = layout.extent();
    expect(min.y).toBeCloseTo(-0.3, 6);
    expect(max.y).toBeCloseTo(2.7, 6);
    expect(min.x).toBeCloseTo(plinth.min.x, 6);
    expect(max.x).toBeCloseTo(plinth.max.x, 6);
    expect(min.z).toBeCloseTo(plinth.min.z, 6);
    expect(max.z).toBeCloseTo(plinth.max.z, 6);
  });
});

describe("pointing", () => {
  it("turns +y onto the asked direction", () => {
    for (const direction of [point(0, 1, 0), point(1, 0, 0), point(0, 0, 1), point(-0.4, -0.8, 0.3), point(0.2, -1, -0.5)]) {
      const turn = pointing(direction);
      // three.js's XYZ Euler on +y: z first, then y (zero here), then x.
      const afterZ = point(-Math.sin(turn.z), Math.cos(turn.z), 0);
      const afterX = point(afterZ.x, afterZ.y * Math.cos(turn.x), afterZ.y * Math.sin(turn.x));
      expect(length(minus(afterX, unit(direction)))).toBeLessThan(1e-9);
    }
  });
});
