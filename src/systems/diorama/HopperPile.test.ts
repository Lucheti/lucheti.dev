import { describe, expect, it } from "vitest";
import { HopperPile } from "./HopperPile";

const range = (from: number, count: number): number[] => Array.from({ length: count }, (_, index) => from + index);

describe("HopperPile", () => {
  it("drops parcels onto the lowest stack, by the fill order on a tie", () => {
    const pile = new HopperPile(3, [1, 0, 2]);
    pile.sync([10, 11, 12, 13]);
    expect(pile.slots()).toEqual([
      { id: 11, column: 0, level: 0 },
      { id: 10, column: 1, level: 0 },
      { id: 13, column: 1, level: 1 },
      { id: 12, column: 2, level: 0 },
    ]);
    expect(pile.overflow()).toBe(0);
  });

  it("keeps a parcel in its column and settles the ones above a dealt one", () => {
    const pile = new HopperPile(3, [0, 1]);
    pile.sync([1, 2, 3, 4]);
    pile.sync([2, 3, 4]);
    expect(pile.slots()).toEqual([
      { id: 3, column: 0, level: 0 },
      { id: 2, column: 1, level: 0 },
      { id: 4, column: 1, level: 1 },
    ]);
  });

  it("counts what it has no room for, and drops it in as room opens", () => {
    const pile = new HopperPile(2, [0, 1, 2]);
    expect(pile.capacity()).toBe(6);
    pile.sync(range(0, 9));
    expect(pile.slots()).toHaveLength(6);
    expect(pile.overflow()).toBe(3);
    pile.sync(range(2, 7));
    expect(pile.slots()).toHaveLength(6);
    expect(pile.overflow()).toBe(1);
    expect(pile.slots().map((slot) => slot.id)).toContain(7);
  });

  it("empties when the queue does", () => {
    const pile = new HopperPile(4, [0, 1, 2, 3, 4, 5]);
    pile.sync(range(0, 30));
    pile.sync([]);
    expect(pile.slots()).toEqual([]);
    expect(pile.overflow()).toBe(0);
  });

  it("never shows a waiting message twice", () => {
    const pile = new HopperPile(3, [2, 0, 1]);
    pile.sync(range(0, 5));
    pile.sync(range(0, 12));
    const ids = pile.slots().map((slot) => slot.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length + pile.overflow()).toBe(12);
  });

  it("refuses a fill order that misses or repeats a column", () => {
    expect(() => new HopperPile(3, [0, 0])).toThrow();
    expect(() => new HopperPile(3, [0, 2])).toThrow();
    expect(() => new HopperPile(0, [0])).toThrow();
  });
});
