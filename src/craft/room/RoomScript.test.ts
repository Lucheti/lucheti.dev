import { describe, expect, it } from "vitest";
import { RoomScript } from "./RoomScript";

const script = new RoomScript({
  heading: { from: 0.1, to: 0.3 },
  sway: { from: 0.7, to: 0.86 },
  fade: { from: 0.94, to: 1 },
});

describe("RoomScript", () => {
  it("shows the heading in place until the camera moves, then fades it as it drifts up", () => {
    expect(script.headingOpacity(0)).toBe(1);
    expect(script.headingRise(0)).toBe(0);
    expect(script.headingOpacity(0.2)).toBeGreaterThan(0);
    expect(script.headingOpacity(0.2)).toBeLessThan(1);
    expect(script.headingOpacity(0.3)).toBe(0);
    expect(script.headingRise(0.3)).toBe(1);
  });

  it("lets the pointer sway the camera until the screen fills the frame", () => {
    expect(script.sway(0.5)).toBe(1);
    expect(script.sway(0.86)).toBe(0);
  });

  it("fades the stage to paper only at the very end", () => {
    expect(script.fade(0.9)).toBe(0);
    expect(script.fade(0.97)).toBeGreaterThan(0);
    expect(script.fade(1)).toBe(1);
  });

  it("refuses a window outside 0…1 or back to front", () => {
    expect(() => new RoomScript({ heading: { from: 0.3, to: 0.1 }, sway: { from: 0.7, to: 0.8 }, fade: { from: 0.9, to: 1 } })).toThrow();
    expect(() => new RoomScript({ heading: { from: 0.1, to: 0.3 }, sway: { from: 0.7, to: 0.8 }, fade: { from: 0.9, to: 1.2 } })).toThrow();
  });
});
