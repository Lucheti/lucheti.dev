import { describe, expect, it } from "vitest";
import { PortraitFraming } from "./PortraitFraming";

const ANCHORS = { headX: 0.52, headTop: 0.08, faceY: 0.3 } as const;
const ASPECT = 1280 / 1589;

describe("PortraitFraming", () => {
  const framing = new PortraitFraming(ASPECT, ANCHORS, { widthRatio: 1, faceAt: 0.42 });

  it("puts the face centre where asked", () => {
    const height = 1 / ASPECT;
    expect(framing.topPercent() / 100 + ANCHORS.faceY * height).toBeCloseTo(0.42, 6);
  });

  it("centres the head horizontally", () => {
    expect(framing.leftPercent() / 100 + ANCHORS.headX).toBeCloseTo(0.5, 6);
  });

  it("reports the width as a percentage", () => {
    expect(framing.widthPercent()).toBe(100);
  });

  it("rejects a framing that crops the head", () => {
    expect(() => new PortraitFraming(ASPECT, ANCHORS, { widthRatio: 1.4, faceAt: 0.3 })).toThrow(RangeError);
  });

  it("rejects a framing that leaves a gap under the shoulders", () => {
    expect(() => new PortraitFraming(ASPECT, ANCHORS, { widthRatio: 0.5, faceAt: 0.45 })).toThrow(RangeError);
  });

  it("rejects a non-positive aspect", () => {
    expect(() => new PortraitFraming(0, ANCHORS, { widthRatio: 1, faceAt: 0.42 })).toThrow(RangeError);
  });
});
