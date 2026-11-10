import { describe, expect, it } from "vitest";
import { FrameStore } from "./FrameStore";

describe("FrameStore", () => {
  it("has no nearest frame while empty", () => {
    expect(new FrameStore<string>(10).nearestIndex(4)).toBeUndefined();
  });

  it("returns the exact frame when it is loaded", () => {
    const store = new FrameStore<string>(20);
    store.put(0, "a");
    store.put(5, "b");
    expect(store.nearestIndex(5)).toBe(5);
  });

  it("falls back to the closest loaded frame on either side", () => {
    const store = new FrameStore<string>(20);
    store.put(0, "a");
    store.put(8, "b");
    store.put(16, "c");
    expect(store.nearestIndex(10)).toBe(8);
    expect(store.nearestIndex(14)).toBe(16);
    expect(store.nearestIndex(19)).toBe(16);
  });

  it("prefers the earlier frame on a tie", () => {
    const store = new FrameStore<string>(20);
    store.put(4, "a");
    store.put(8, "b");
    expect(store.nearestIndex(6)).toBe(4);
  });

  it("clamps the wanted index into the sequence", () => {
    const store = new FrameStore<string>(10);
    store.put(2, "a");
    expect(store.nearestIndex(-5)).toBe(2);
    expect(store.nearestIndex(99)).toBe(2);
  });

  it("counts a frame once however often it is stored", () => {
    const store = new FrameStore<string>(10);
    store.put(3, "a");
    store.put(3, "b");
    expect(store.loadedCount()).toBe(1);
    expect(store.get(3)).toBe("b");
  });

  it("rejects out-of-range writes", () => {
    const store = new FrameStore<string>(10);
    expect(() => store.put(10, "x")).toThrow(RangeError);
    expect(() => store.put(-1, "x")).toThrow(RangeError);
  });
});
