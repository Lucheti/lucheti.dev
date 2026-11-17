import { describe, expect, it } from "vitest";
import { IsometricView } from "@/craft/layers/IsometricView";
import { DioramaLayout } from "./DioramaLayout";
import { DioramaSketch } from "./DioramaSketch";
import { shade } from "./toon";

describe("DioramaSketch", () => {
  const sketch = new DioramaSketch(new DioramaLayout(), new IsometricView((40 * Math.PI) / 180, Math.PI / 6));
  const faces = sketch.faces();
  const tones = faces.map((face) => face.tone);

  it("draws three faces per box, each a closed quad of finite points", () => {
    expect(faces.length % 3).toBe(0);
    expect(faces.length).toBeGreaterThan(60);
    for (const face of faces) {
      expect(face.points).toHaveLength(4);
      for (const p of face.points) {
        expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
      }
    }
  });

  it("draws the plinth first, the walls before the furniture, and keeps every point inside its bounds", () => {
    expect(["earth", "bedrock"]).toContain(faces[0].tone);
    expect(tones.lastIndexOf("wallBack")).toBeLessThan(tones.indexOf("wood"));
    expect(tones.lastIndexOf("plank")).toBeLessThan(tones.indexOf("rug"));
    const { minX, maxX, minY, maxY } = sketch.bounds();
    for (const face of faces) {
      for (const p of face.points) {
        expect(p.x).toBeGreaterThanOrEqual(minX);
        expect(p.x).toBeLessThanOrEqual(maxX);
        expect(p.y).toBeGreaterThanOrEqual(minY);
        expect(p.y).toBeLessThanOrEqual(maxY);
      }
    }
  });

  it("leaves out the small things, and gives the shadow the plinth's footprint", () => {
    // Of the keyboard's keys, only the space bar is big enough to draw.
    expect(faces.filter((face) => face.tone === "key")).toHaveLength(3);
    expect(tones).not.toContain("steam");
    expect(sketch.footprint()).toHaveLength(4);
  });
});

describe("shade", () => {
  it("darkens a colour toward black and clamps the factor", () => {
    expect(shade("#ff8040", 1)).toBe("#ff8040");
    expect(shade("#ff8040", 0.5)).toBe("#804020");
    expect(shade("#ff8040", 0)).toBe("#000000");
    expect(shade("#ff8040", 2)).toBe("#ff8040");
  });
});
