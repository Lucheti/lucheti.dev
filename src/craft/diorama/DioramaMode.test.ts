import { describe, expect, it } from "vitest";
import { behaviourOf, pickMode } from "./DioramaMode";

describe("DioramaMode", () => {
  it("lets a wide screen live, lean and drag", () => {
    expect(behaviourOf(pickMode(true, false))).toMatchObject({ idle: true, parallax: true, drag: true, animate: true });
  });

  it("keeps phones alive but never dragging or leaning, so the page still scrolls", () => {
    expect(behaviourOf(pickMode(false, false))).toMatchObject({ idle: true, parallax: false, drag: false, animate: true });
  });

  it("holds still under reduced motion at any width, applying clicks at once", () => {
    for (const wide of [true, false]) {
      const behaviour = behaviourOf(pickMode(wide, true));
      expect(behaviour).toMatchObject({ idle: false, parallax: false, animate: false });
      expect(behaviour.drag).toBe(wide);
    }
  });
});
