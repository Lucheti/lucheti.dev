import { describe, expect, it } from "vitest";
import { FrameUrls } from "./FrameUrls";
import { LoadOrder } from "./LoadOrder";

describe("LoadOrder", () => {
  it("starts with the first frame, then every stride-th, then the rest", () => {
    expect(new LoadOrder(20, 8).indices()).toEqual([
      0, 8, 16, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 17, 18, 19,
    ]);
  });

  it("requests every frame exactly once", () => {
    const indices = new LoadOrder(145, 8).indices();
    expect(indices).toHaveLength(145);
    expect(new Set(indices).size).toBe(145);
  });

  it("counts the first frame within the coarse pass", () => {
    expect(new LoadOrder(145, 8).coarseCount()).toBe(19);
  });

  it("rejects invalid sizes", () => {
    expect(() => new LoadOrder(0, 8)).toThrow(RangeError);
    expect(() => new LoadOrder(10, 0)).toThrow(RangeError);
  });
});

describe("FrameUrls", () => {
  const urls = new FrameUrls({ width: 854, directory: "/backdrop/854" });

  it("is four-digit and one-based", () => {
    expect(urls.forIndex(0)).toBe("/backdrop/854/0001.webp");
    expect(urls.forIndex(144)).toBe("/backdrop/854/0145.webp");
    expect(urls.forIndex(9999 - 1)).toBe("/backdrop/854/9999.webp");
  });

  it("rejects negative indices", () => {
    expect(() => urls.forIndex(-1)).toThrow(RangeError);
  });
});
