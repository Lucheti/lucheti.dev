import { describe, expect, it } from "vitest";
import { IsometricView } from "../layers/IsometricView";
import { shade } from "./clay";
import { RoomLayout } from "./RoomLayout";
import { RoomSketch } from "./RoomSketch";

describe("RoomSketch", () => {
  const sketch = new RoomSketch(new RoomLayout(), new IsometricView());
  const faces = sketch.faces();

  it("draws three faces per block, each a closed quad of finite points", () => {
    expect(faces.length % 3).toBe(0);
    expect(faces.length).toBeGreaterThan(30);
    for (const face of faces) {
      expect(face.points).toHaveLength(4);
      for (const p of face.points) {
        expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
      }
    }
  });

  it("draws the floor first and keeps every point inside its bounds", () => {
    expect(faces[0].tone).toBe("floor");
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

  it("paints the walls before the furniture, and the desk top over the drawers under it", () => {
    const lastWall = faces.map((face) => face.tone).lastIndexOf("plaster");
    const firstWood = faces.findIndex((face) => face.tone === "wood");
    const lastWhite = faces.map((face) => face.tone).lastIndexOf("white");
    expect(lastWall).toBeLessThan(firstWood);
    expect(lastWhite).toBeLessThan(firstWood);
  });

  it("leaves out the small props", () => {
    expect(faces.some((face) => face.tone === "signal" && face.side === "top")).toBe(true);
    expect(faces.filter((face) => face.tone === "white").length).toBeLessThan(40);
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
