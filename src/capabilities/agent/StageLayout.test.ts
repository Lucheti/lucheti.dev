import { describe, expect, it } from "vitest";
import { COMPACT_STAGE, WIDE_STAGE } from "./agentConfig";
import { StageLayout, type Rect } from "./StageLayout";

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

describe("StageLayout", () => {
  const wide = new StageLayout(WIDE_STAGE);
  const compact = new StageLayout(COMPACT_STAGE);

  it("lays every station out once, on the stage, without tiles overlapping", () => {
    for (const layout of [wide, compact]) {
      const { width, height } = layout.size();
      const stations = layout.stations();
      expect([...stations].sort()).toEqual(["code", "inbox", "read", "search", "ship", "test"]);
      const tiles = stations.map((station) => layout.tile(station));
      tiles.forEach((tile, index) => {
        expect(tile.x).toBeGreaterThanOrEqual(0);
        expect(tile.x + tile.width).toBeLessThanOrEqual(width);
        expect(tile.y + tile.height).toBeLessThanOrEqual(height);
        tiles.slice(index + 1).forEach((other) => expect(overlaps(tile, other)).toBe(false));
      });
    }
  });

  it("stands the agent over the middle of each tile, in the lane above it", () => {
    for (const layout of [wide, compact]) {
      for (const station of layout.stations()) {
        const spot = layout.spot(station);
        const tile = layout.tile(station);
        expect(spot.x).toBeCloseTo(tile.x + tile.width / 2, 6);
        expect(spot.y).toBeLessThan(tile.y);
      }
    }
  });

  it("walks along a row, easing from one spot to the other with footsteps", () => {
    const leg = wide.leg("read", "search");
    expect(leg.airborne).toBe(false);
    expect(leg.durationMs).toBe(700);
    expect(leg.at(0).ground).toEqual(wide.spot("read"));
    expect(leg.at(1).ground).toEqual(wide.spot("search"));
    expect(leg.at(0.5).lift).toBe(0);
    expect(leg.at(1).stride).toBeGreaterThan(leg.at(0.5).stride);
    expect(wide.leg("ship", "inbox").durationMs).toBe(1700);
  });

  it("hops when the row changes, leaving the floor only in the middle", () => {
    const leg = compact.leg("search", "code");
    expect(leg.airborne).toBe(true);
    expect(leg.at(0).ground).toEqual(compact.spot("search"));
    expect(leg.at(0).lift).toBe(0);
    expect(leg.at(0.5).lift).toBeGreaterThan(20);
    expect(leg.at(1).lift).toBeCloseTo(0, 9);
    expect(leg.at(1).ground).toEqual(compact.spot("code"));
    expect(compact.leg("ship", "inbox").airborne).toBe(true);
    expect(compact.leg("test", "code").airborne).toBe(false);
  });

  it("draws one lane per row", () => {
    expect(wide.lanes()).toHaveLength(1);
    expect(compact.lanes()).toHaveLength(2);
  });

  it("refuses a station laid out twice, a leg to nowhere, and tiles too wide", () => {
    expect(() => new StageLayout({ ...WIDE_STAGE, rows: [["read", "read"]] })).toThrow();
    expect(() => wide.leg("code", "code")).toThrow();
    expect(() => new StageLayout({ ...WIDE_STAGE, tile: { width: 500, height: 50 } })).toThrow();
    expect(() => new StageLayout({ ...WIDE_STAGE, lanes: [] })).toThrow();
  });
});
