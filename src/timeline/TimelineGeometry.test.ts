import { describe, expect, it } from "vitest";
import { splitAtMarker } from "./splitAtMarker";
import { TimelineGeometry } from "./TimelineGeometry";

const SEVEN_STOPS = 7;
const AFTER_THIRD = 2;

describe("TimelineGeometry", () => {
  const wide = new TimelineGeometry(1600, SEVEN_STOPS, AFTER_THIRD);
  const narrow = new TimelineGeometry(768, SEVEN_STOPS, AFTER_THIRD);

  it("spaces stops at 38vw, never under 340px", () => {
    expect(wide.spacing()).toBeCloseTo(608);
    expect(narrow.spacing()).toBe(340);
  });

  it("starts the first stop near the reading line", () => {
    expect(wide.stopX(0)).toBeCloseTo(720);
    expect(wide.readingX()).toBeCloseTo(672);
    expect(wide.activeIndex(0)).toBe(0);
  });

  it("travels exactly the distance between the first and last stop", () => {
    expect(wide.travel()).toBeCloseTo(6 * 608);
    expect(wide.trackWidth()).toBeCloseTo(1600 + 6 * 608);
    expect(wide.stopX(6) + wide.xAt(1)).toBeCloseTo(wide.stopX(0));
  });

  it("maps progress to x and back, clamped", () => {
    expect(wide.xAt(0)).toBeCloseTo(0);
    expect(wide.xAt(2)).toBeCloseTo(-wide.travel());
    expect(wide.xAt(-1)).toBeCloseTo(0);
    expect(wide.progressAt(-wide.travel() / 2)).toBeCloseTo(0.5);
    expect(wide.progressAt(500)).toBe(0);
    expect(wide.progressAt(-1e9)).toBe(1);
  });

  it("picks the stop closest to the reading line", () => {
    for (let index = 0; index < SEVEN_STOPS; index += 1) {
      const x = wide.readingX() - wide.stopX(index);
      expect(wide.activeIndex(x)).toBe(index);
    }
    const halfway = wide.readingX() - wide.stopX(1) - wide.spacing() * 0.6;
    expect(wide.activeIndex(halfway)).toBe(2);
  });

  it("places the marker between the stops it separates", () => {
    expect(wide.markerX()).toBeGreaterThan(wide.stopX(AFTER_THIRD));
    expect(wide.markerX()).toBeLessThan(wide.stopX(AFTER_THIRD + 1));
    expect(wide.markerX()).toBeCloseTo((wide.stopX(2) + wide.stopX(3)) / 2);
  });

  it("splits the progress bar at the marker", () => {
    const marker = wide.markerProgress();
    expect(marker).toBeGreaterThan(0);
    expect(marker).toBeLessThan(1);
    expect(wide.barFill(0)).toEqual({ before: 0, after: 0 });
    expect(wide.barFill(marker / 2).after).toBe(0);
    expect(wide.barFill(marker / 2).before).toBeCloseTo(0.5);
    expect(wide.barFill(1)).toEqual({ before: 1, after: 1 });
  });

  it("handles a single stop without dividing by zero", () => {
    const single = new TimelineGeometry(1000, 1, 0);
    expect(single.travel()).toBe(0);
    expect(single.progressAt(0)).toBe(0);
    expect(single.barFill(0.5).before).toBe(1);
  });

  it("rejects impossible input", () => {
    expect(() => new TimelineGeometry(0, 3, 0)).toThrow(RangeError);
    expect(() => new TimelineGeometry(800, 0, 0)).toThrow(RangeError);
    expect(() => new TimelineGeometry(800, 3, 3)).toThrow(RangeError);
  });
});

describe("splitAtMarker", () => {
  it("keeps the stop before the marker on the before side", () => {
    expect(splitAtMarker([1, 2, 3, 4], 1)).toEqual({ before: [1, 2], after: [3, 4] });
  });

  it("leaves nothing after when the marker follows the last stop", () => {
    expect(splitAtMarker([1, 2], 1)).toEqual({ before: [1, 2], after: [] });
  });
});
