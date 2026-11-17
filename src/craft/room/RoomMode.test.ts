import { describe, expect, it } from "vitest";
import { behaviourOf, pickMode } from "./RoomMode";

describe("RoomMode", () => {
  it("pins the room on wide screens and lets scroll drive the camera", () => {
    const behaviour = behaviourOf(pickMode(true, false));
    expect(behaviour.scroll).toBe(true);
    expect(behaviour.sway).toBe(true);
    expect(behaviour.heading).toBe("over");
  });

  it("keeps phones to the wide shot, alive but not scroll-driven, at a lower resolution", () => {
    const behaviour = behaviourOf(pickMode(false, false));
    expect(behaviour.scroll).toBe(false);
    expect(behaviour.idle).toBe(true);
    expect(behaviour.heading).toBe("apart");
    expect(behaviour.maxDpr).toBeLessThan(2);
  });

  it("holds a still wide shot when motion is reduced, at any width", () => {
    for (const wide of [true, false]) {
      const behaviour = behaviourOf(pickMode(wide, true));
      expect(behaviour.scroll).toBe(false);
      expect(behaviour.idle).toBe(false);
      expect(behaviour.sway).toBe(false);
      expect(behaviour.heading).toBe(wide ? "over" : "apart");
    }
  });
});
