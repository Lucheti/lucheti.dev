import { describe, expect, it } from "vitest";
import type { DiffusionFraming, DiffusionMood, DiffusionSubject } from "@/content";
import { PaletteBook } from "./Palette";
import { SceneRecipe, type PromptChips } from "./SceneRecipe";
import type { Shape } from "./SceneShapes";

const SUBJECTS: readonly DiffusionSubject[] = ["lighthouse", "vase", "mountain", "city"];
const MOODS: readonly DiffusionMood[] = ["dusk", "night", "morning", "storm"];
const FRAMINGS: readonly DiffusionFraming[] = ["wide", "close-up"];

function numbersOf(shape: Shape): readonly number[] {
  switch (shape.kind) {
    case "circle":
      return [shape.cx, shape.cy, shape.r];
    case "ellipse":
      return [shape.cx, shape.cy, shape.rx, shape.ry];
    case "rect":
      return [shape.x, shape.y, shape.width, shape.height, shape.radius];
    case "polygon":
      return shape.points.flatMap((point) => [point.x, point.y]);
    case "line":
      return [shape.from.x, shape.from.y, shape.to.x, shape.to.y, shape.width];
  }
}

describe("SceneRecipe", () => {
  const chips: PromptChips = { subject: "lighthouse", mood: "dusk", framing: "wide" };

  it("gives the same scene for the same chips and seed", () => {
    expect(SceneRecipe.compose(chips, 7)).toEqual(SceneRecipe.compose(chips, 7));
  });

  it("re-rolls the composition with another seed", () => {
    expect(SceneRecipe.compose(chips, 7)).not.toEqual(SceneRecipe.compose(chips, 8));
  });

  it("keeps the composition when only the framing changes", () => {
    const wide = SceneRecipe.compose(chips, 21);
    const close = SceneRecipe.compose({ ...chips, framing: "close-up" }, 21);
    expect(close.shapes).toHaveLength(wide.shapes.length);
    expect(close.sky).toEqual(wide.sky);
    expect(close.shapes).not.toEqual(wide.shapes);
  });

  it("crops in on the subject for a close-up", () => {
    const wide = SceneRecipe.compose(chips, 3);
    const close = SceneRecipe.compose({ ...chips, framing: "close-up" }, 3);
    const widest = (shapes: readonly Shape[]): number =>
      Math.max(...shapes.map((shape) => (shape.kind === "circle" ? shape.r : 0)));
    expect(widest(close.shapes)).toBeGreaterThan(widest(wide.shapes));
  });

  it("paints each mood in its own palette", () => {
    const skies = MOODS.map((mood) => SceneRecipe.compose({ ...chips, mood }, 5).sky.top);
    expect(new Set(skies).size).toBe(MOODS.length);
    for (const mood of MOODS) {
      expect(SceneRecipe.compose({ ...chips, mood }, 5).sky.top).toBe(PaletteBook.of(mood).skyTop);
    }
  });

  it("draws every subject differently", () => {
    const scenes = SUBJECTS.map((subject) => JSON.stringify(SceneRecipe.compose({ ...chips, subject }, 5).shapes));
    expect(new Set(scenes).size).toBe(SUBJECTS.length);
  });

  it("produces sane, bounded scenes for every combination", () => {
    for (const subject of SUBJECTS) {
      for (const mood of MOODS) {
        for (const framing of FRAMINGS) {
          for (const seed of [1, 2, 99]) {
            const scene = SceneRecipe.compose({ subject, mood, framing }, seed);
            expect(scene.shapes.length).toBeGreaterThan(8);
            expect(scene.shapes.length).toBeLessThan(700);
            for (const shape of scene.shapes) {
              expect(numbersOf(shape).every((value) => Number.isFinite(value))).toBe(true);
              expect(shape.opacity).toBeGreaterThanOrEqual(0);
              expect(shape.opacity).toBeLessThanOrEqual(1);
            }
          }
        }
      }
    }
  });
});
