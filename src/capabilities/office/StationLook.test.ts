import { describe, expect, it } from "vitest";
import { actionOf, actionsOf, lookOf, rocketAt, ROCKET_CLIMB, stampDrop } from "./StationLook";
import type { Beat, Leg } from "./types";

const beat = (leg: Leg, progress: number): Beat => ({ leg, index: 0, progress });

describe("StationLook", () => {
  it("plays each step at its station, and nothing for a ticket in the air", () => {
    expect(actionOf(beat({ kind: "stamp" }, 0.5))).toEqual({ station: "product", action: { kind: "stamp", progress: 0.5 } });
    expect(actionOf(beat({ kind: "verdict", pass: false }, 0.2))?.station).toBe("qa");
    expect(actionOf(beat({ kind: "travel", from: "design", to: "engineering" }, 0.5))).toBeNull();
    expect(actionOf(beat({ kind: "split" }, 0.5))).toBeNull();
  });

  it("folds every ticket on the floor into what each station is doing; the rest idle", () => {
    const actions = actionsOf([beat({ kind: "sketch" }, 0.4), beat({ kind: "launch" }, 0.5)]);
    expect(actions.design.kind).toBe("sketch");
    expect(actions.release.kind).toBe("launch");
    expect(actions.product.kind).toBe("idle");
    expect(actions.engineering.kind).toBe("idle");
  });

  it("thumps the stamp down onto the ticket and lifts it again", () => {
    expect(stampDrop(0)).toBe(-0);
    expect(stampDrop(0.2)).toBeLessThan(0);
    expect(stampDrop(0.5)).toBe(1);
    expect(stampDrop(1)).toBe(0);
  });

  it("lifts the rocket off, hangs it at the top, and lands it back on its pad", () => {
    expect(rocketAt(0).height).toBe(0);
    expect(rocketAt(0.2).rumble).toBeGreaterThan(0);
    expect(rocketAt(0.62).height).toBeCloseTo(ROCKET_CLIMB, 6);
    expect(rocketAt(0.45).flame).toBe(1);
    expect(rocketAt(0.97).squash).toBeGreaterThan(0);
    expect(rocketAt(1)).toEqual({ height: 0, flame: 0, rumble: 0, squash: 0 });
  });

  it("maps each action to its look: amber while QA looks, green or red after, the screens flickering while engineers type", () => {
    expect(lookOf({ kind: "idle" }).mood).toBe("idle");
    expect(lookOf({ kind: "inspect", progress: 0.5 }).light).toBe("amber");
    expect(lookOf({ kind: "verdict", pass: true, progress: 0.5 })).toMatchObject({ light: "green", mood: "cheer" });
    expect(lookOf({ kind: "verdict", pass: false, progress: 0.5 })).toMatchObject({ light: "red", mood: "frown" });
    expect(lookOf({ kind: "type", progress: 0.5 }).typing).toBe(true);
    expect(lookOf({ kind: "sketch", progress: 1 }).sketch).toBe(1);
    expect(lookOf({ kind: "idle" }).sketch).toBeNull();
  });
});
