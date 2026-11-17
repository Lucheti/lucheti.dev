import { describe, expect, it } from "vitest";
import { GhostScript, PRESS_MS, type GhostTarget, type Locator, type Point } from "./GhostScript";

const PLACES: Readonly<Record<string, Point>> = {
  rest: { x: 0, y: 0 },
  "row-0": { x: 100, y: 0 },
  search: { x: 100, y: 100 },
};

const locate: Locator = (target: GhostTarget) => {
  switch (target.kind) {
    case "rest":
    case "search":
      return PLACES[target.kind];
    case "row":
      return PLACES[`row-${target.slot}`];
    default:
      return { x: -1, y: -1 };
  }
};

// 0–1000 move to the row, 1000–1500 wait, 1500–1900 click, 1900–2300 type "ab", 2300–2800 key, 2800–3800 back to rest.
const script = new GhostScript([
  { kind: "move", to: { kind: "row", slot: 0 }, ms: 1000 },
  { kind: "wait", ms: 500 },
  { kind: "click", effect: { kind: "complete", slot: 0 }, ms: 400 },
  { kind: "type", text: "ab", msPerKey: 200 },
  { kind: "key", effect: { kind: "close-palette" }, ms: 500 },
  { kind: "move", to: { kind: "rest" }, ms: 1000 },
]);

describe("GhostScript", () => {
  it("adds up the steps into one loop", () => {
    expect(script.duration()).toBe(3800);
  });

  it("starts the first move from where the loop ends, and arrives on time", () => {
    expect(script.frameAt(0, locate).point).toEqual({ x: 0, y: 0 });
    expect(script.frameAt(1000, locate)).toEqual({ point: { x: 100, y: 0 }, pressed: false, over: { kind: "row", slot: 0 } });
  });

  it("eases along a shallow arc while it travels, resting over nothing", () => {
    const half = script.frameAt(500, locate);
    expect(half.over).toBeNull();
    expect(half.point.x).toBeCloseTo(50, 5);
    expect(Math.abs(half.point.y)).toBeGreaterThan(0);
    expect(Math.abs(half.point.y)).toBeLessThanOrEqual(10);
    expect(script.frameAt(100, locate).point.x).toBeLessThan(10);
  });

  it("holds the button down at the start of a click, then lets go", () => {
    expect(script.frameAt(1500, locate).pressed).toBe(true);
    expect(script.frameAt(1500 + PRESS_MS + 1, locate).pressed).toBe(false);
    expect(script.frameAt(1600, locate).over).toEqual({ kind: "row", slot: 0 });
  });

  it("wraps round", () => {
    expect(script.frameAt(3800 + 1000, locate)).toEqual(script.frameAt(1000, locate));
  });

  it("reports the clicks, keys and letters that landed in a stretch of time, in order", () => {
    expect(script.effectsBetween(0, 1500)).toEqual([]);
    expect(script.effectsBetween(1500, 1700)).toEqual([{ kind: "complete", slot: 0 }]);
    expect(script.effectsBetween(1700, 2800)).toEqual([
      { kind: "type", query: "a" },
      { kind: "type", query: "ab" },
      { kind: "close-palette" },
    ]);
  });

  it("counts an effect once, across loops too", () => {
    expect(script.effectsBetween(1500 + PRESS_MS, 1700)).toEqual([]);
    expect(script.effectsBetween(3700, 3800 + 1700)).toEqual([{ kind: "complete", slot: 0 }]);
    expect(script.effectsBetween(0, 3800 * 5)).toHaveLength(4);
    expect(script.effectsBetween(500, 500)).toEqual([]);
  });

  it("refuses a loop without moves or with a step that takes no time", () => {
    expect(() => new GhostScript([{ kind: "wait", ms: 100 }])).toThrow();
    expect(() => new GhostScript([{ kind: "move", to: { kind: "search" }, ms: 0 }])).toThrow();
  });
});
