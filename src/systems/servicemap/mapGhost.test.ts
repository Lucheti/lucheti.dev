import { describe, expect, it } from "vitest";
import { GhostScript, type Locator } from "@/laptop/GhostScript";
import { mapConfig } from "./mapConfig";
import { MapHands, MapMarks, mapGhostLoop, type MapActions, type MapEffect, type MapTarget } from "./mapGhost";
import type { ServiceId } from "./topology";

const locate: Locator<MapTarget> = (target) => {
  switch (target.kind) {
    case "rest":
      return { x: 300, y: 300 };
    case "service":
      return { x: 250, y: 100 };
    case "store":
      return { x: 450, y: 150 };
    case "spike":
      return { x: 500, y: 20 };
    default:
      return { x: 0, y: 0 };
  }
};

/** Writes down what the ghost did. */
class Ledger implements MapActions {
  public readonly done: string[] = [];

  public takeDown(service: ServiceId): boolean {
    this.done.push(`down ${service}`);
    return true;
  }

  public spike(): boolean {
    this.done.push("spike");
    return true;
  }
}

describe("the map's ghost loop", () => {
  const script = new GhostScript<MapTarget, MapEffect>(mapGhostLoop("payments"));

  it("takes the service down, then simulates a spike, once a loop", () => {
    expect(script.effectsBetween(0, script.duration())).toEqual([{ kind: "take-down", service: "payments" }, { kind: "spike" }]);
  });

  it("waits out the whole outage before it reaches for the spike", () => {
    const loop = mapGhostLoop("payments");
    const clickAt = (kind: MapEffect["kind"]): number => {
      let clock = 0;
      for (const step of loop) {
        if (step.kind === "click" && step.effect.kind === kind) {
          return clock;
        }
        clock += step.kind === "type" ? step.text.length * step.msPerKey : step.ms;
      }
      throw new Error(`No ${kind} click`);
    };
    const { downMs, breaker } = mapConfig();
    expect(clickAt("spike") - clickAt("take-down")).toBeGreaterThan(Math.max(downMs, breaker.openMs) + 3000);
  });

  it("is calm: a loop takes half a minute or so", () => {
    expect(script.duration()).toBeGreaterThan(25_000);
    expect(script.duration()).toBeLessThan(45_000);
  });

  it("hovers the service before it clicks it", () => {
    const hovering = script.frameAt(4000, locate);
    expect(hovering.over).toEqual({ kind: "service", service: "payments" });
    expect(hovering.pressed).toBe(false);
  });

  it("turns clicks into the visitor's own actions", () => {
    const ledger = new Ledger();
    const hands = new MapHands(ledger);
    hands.apply({ kind: "take-down", service: "orders" });
    hands.apply({ kind: "spike" });
    hands.tidy();
    hands.letGo();
    expect(ledger.done).toEqual(["down orders", "spike"]);
  });
});

describe("MapMarks", () => {
  const marks = new MapMarks();

  it("names each place the way the app marks it", () => {
    expect(marks.keyOf({ kind: "service", service: "inventory" })).toBe("service-inventory");
    expect(marks.keyOf({ kind: "store", store: "nats" })).toBe("store-nats");
    expect(marks.keyOf({ kind: "spike" })).toBe("spike");
    expect(marks.keyOf(marks.rest)).toBe("rest");
  });

  it("aims at a card's name rather than its middle", () => {
    expect(marks.aim({ kind: "service", service: "orders" }, { width: 128, height: 44 })).toEqual({ x: 48, y: 26.4 });
  });
});
