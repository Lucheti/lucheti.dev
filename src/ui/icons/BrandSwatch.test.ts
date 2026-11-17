import { describe, expect, it } from "vitest";
import { brandSwatch, contrastRatio } from "./BrandSwatch";

const PAPER = "#f3f2ee";
const GRAPHITE = "#121212";

describe("contrastRatio", () => {
  it("spans 1 to 21 and does not care about order", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
    expect(contrastRatio("#4169e1", "#4169e1")).toBe(1);
  });

  it("matches the published WCAG figure for a mid grey on white", () => {
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  });
});

describe("brandSwatch", () => {
  it("normalises the Simple Icons hex into a CSS colour", () => {
    expect(brandSwatch("61DAFB", PAPER).fill).toBe("#61dafb");
    expect(brandSwatch("#E0234E", PAPER).fill).toBe("#e0234e");
  });

  it("puts a near-black mark on light brands", () => {
    expect(brandSwatch("61DAFB", PAPER).ink).toBe("#111111"); // React
    expect(brandSwatch("C5F74F", PAPER).ink).toBe("#111111"); // Drizzle
    expect(brandSwatch("D97757", PAPER).ink).toBe("#111111"); // Claude
  });

  it("puts a white mark on dark and saturated brands", () => {
    expect(brandSwatch("000000", PAPER).ink).toBe("#ffffff"); // Next.js
    expect(brandSwatch("143055", PAPER).ink).toBe("#ffffff"); // Nx
    expect(brandSwatch("4169E1", PAPER).ink).toBe("#ffffff"); // PostgreSQL
  });

  it("picks the higher contrast when the call is close", () => {
    const nest = brandSwatch("E0234E", PAPER);
    expect(nest.ink).toBe("#ffffff");
    expect(contrastRatio(nest.fill, "#ffffff")).toBeGreaterThan(contrastRatio(nest.fill, "#111111"));
  });

  it("asks for an edge only when the fill melts into the ground", () => {
    expect(brandSwatch("ECE8D1", PAPER).edge).toBe(true); // TanStack on paper
    expect(brandSwatch("61DAFB", PAPER).edge).toBe(false);
    expect(brandSwatch("000000", GRAPHITE).edge).toBe(true);
    expect(brandSwatch("000000", PAPER).edge).toBe(false);
  });

  it("rejects anything that is not a six-digit hex colour", () => {
    expect(() => brandSwatch("fff", PAPER)).toThrow();
    expect(() => brandSwatch("tomato", PAPER)).toThrow();
    expect(() => brandSwatch("61DAFB", "")).toThrow();
  });
});
