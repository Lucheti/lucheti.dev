import { describe, expect, it } from "vitest";
import { parallaxOffset } from "./Parallax";

describe("parallaxOffset", () => {
  it("runs from −travel to +travel across the chapter", () => {
    expect(parallaxOffset(0, 60)).toBe(-60);
    expect(parallaxOffset(0.5, 60)).toBe(0);
    expect(parallaxOffset(1, 60)).toBe(60);
  });

  it("is linear in between", () => {
    expect(parallaxOffset(0.25, 60)).toBe(-30);
    expect(parallaxOffset(0.75, 60)).toBe(30);
  });

  it("clamps progress outside 0–1 and treats non-finite progress as the start", () => {
    expect(parallaxOffset(-0.4, 60)).toBe(-60);
    expect(parallaxOffset(1.7, 60)).toBe(60);
    expect(parallaxOffset(Number.NaN, 60)).toBe(-60);
  });

  it("stays put when there is no travel, as under reduced motion", () => {
    expect(Math.abs(parallaxOffset(0.1, 0))).toBe(0);
    expect(Math.abs(parallaxOffset(0.9, 0))).toBe(0);
  });
});
