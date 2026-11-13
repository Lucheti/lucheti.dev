import { describe, expect, it } from "vitest";
import type { Department, OrchestraStep } from "@/content";
import { SITE } from "@/content";
import { channelKey, LifecycleScript, type BoardState } from "./LifecycleScript";
import { Roster } from "./Roster";

const departments: readonly Department[] = [
  { id: "product", name: "Product", agents: ["head-of-product", "product-manager"] },
  { id: "design", name: "Design", agents: ["designer"] },
  { id: "engineering", name: "Engineering", agents: ["engineer"] },
  { id: "release", name: "Release", agents: ["release-manager"] },
];

/** Four steps: windows of 0.2 starting at 0.15, 0.35, 0.55 and 0.75. */
const steps: readonly OrchestraStep[] = [
  { department: "product", workers: ["head-of-product"], ticket: "F-1", message: "accepted" },
  { department: "product", workers: ["product-manager"], ticket: "F-1", message: "PRD" },
  { department: "engineering", workers: ["engineer", "engineer"], ticket: "C-1", message: "build" },
  { department: "release", workers: [], ticket: "F-1", message: "deployed by code" },
];

const script = new LifecycleScript(steps, Roster.of(departments, steps), 3);

function statusAt(state: BoardState, id: Department["id"]): string | undefined {
  return state.departments.get(id)?.status.kind;
}

describe("LifecycleScript", () => {
  it("waits, with nothing shown, before the first step", () => {
    const state = script.stateAt(0);
    expect(state.phase).toEqual({ kind: "waiting" });
    expect(state.principles).toBe(0);
    expect(state.statsShown).toBe(false);
    expect(state.dispatched).toBe(0);
    expect([...state.departments.values()].every((d) => d.status.kind === "idle" && !d.done)).toBe(true);
  });

  it("reveals principles at 0.2, 0.35 and 0.5, and the stats from 0.55", () => {
    expect([0.19, 0.2, 0.35, 0.5, 1].map((p) => script.stateAt(p).principles)).toEqual([0, 1, 2, 3, 3]);
    expect(script.stateAt(0.54).statsShown).toBe(false);
    expect(script.stateAt(0.55).statsShown).toBe(true);
  });

  it("spreads the steps evenly from 0.15 to 0.95", () => {
    expect([0.14, 0.15, 0.349, 0.35, 0.55, 0.75, 0.95, 1].map((p) => script.stepAt(p))).toEqual([
      -1, 0, 0, 1, 2, 3, 3, 3,
    ]);
  });

  it("starts with the first department working, without a handoff", () => {
    const state = script.stateAt(0.15);
    expect(state.phase).toEqual({ kind: "holding", step: 0 });
    expect(state.departments.get("product")?.status).toEqual({ kind: "working", rows: ["head-of-product#1"] });
    expect(state.dispatched).toBe(1);
  });

  it("changes workers in place when a step stays in the same department", () => {
    const state = script.stateAt(0.36);
    expect(state.phase).toEqual({ kind: "holding", step: 1 });
    expect(state.departments.get("product")?.status).toEqual({ kind: "working", rows: ["product-manager#1"] });
    expect(script.transitAt(0.36)).toBe(1);
  });

  it("hands off during the first half of a new department's window", () => {
    const state = script.stateAt(0.6);
    expect(state.phase).toEqual({ kind: "transit", step: 2, from: "product", to: "engineering" });
    expect(state.departments.get("product")?.status).toEqual({ kind: "handing-off", to: "engineering" });
    expect(statusAt(state, "engineering")).toBe("idle");
    expect(state.channels.get(channelKey("product", "engineering"))).toBe("carrying");
    expect(state.dispatched).toBe(3);
    expect(script.transitAt(0.55)).toBeCloseTo(0);
    expect(script.transitAt(0.6)).toBeCloseTo(0.5);
  });

  it("puts the receiver to work once the packet lands, and marks the sender done", () => {
    const state = script.stateAt(0.66);
    expect(state.phase).toEqual({ kind: "holding", step: 2 });
    expect(state.departments.get("engineering")?.status).toEqual({
      kind: "working",
      rows: ["engineer#1", "engineer#2"],
    });
    expect(state.departments.get("product")).toEqual({ status: { kind: "idle" }, done: true });
    expect(state.channels.get(channelKey("product", "engineering"))).toBe("used");
  });

  it("labels the packet with the ticket of the step in play", () => {
    expect(script.ticketIn(script.stateAt(0).phase)).toBe("F-1");
    expect(script.ticketIn(script.stateAt(0.6).phase)).toBe("C-1");
    expect(script.ticketIn(script.stateAt(1).phase)).toBe("F-1");
  });

  it("shows a step without workers as automated", () => {
    expect(statusAt(script.stateAt(1), "release")).toBe("automated");
  });

  it("never marks an untouched department done", () => {
    expect(script.stateAt(1).departments.get("design")).toEqual({ status: { kind: "idle" }, done: false });
  });

  it("lists each handoff pair once, in order of first use", () => {
    expect(script.channels()).toEqual([
      { key: channelKey("product", "engineering"), from: "product", to: "engineering" },
      { key: channelKey("engineering", "release"), from: "engineering", to: "release" },
    ]);
    expect(script.stateAt(0.4).channels.get(channelKey("engineering", "release"))).toBe("unused");
  });

  it("is reversible: the state depends only on progress", () => {
    const forward = script.stateAt(0.6);
    script.stateAt(1);
    expect(script.stateAt(0.6)).toEqual(forward);
  });

  it("compares states by their discrete parts", () => {
    expect(LifecycleScript.same(script.stateAt(0.56), script.stateAt(0.6))).toBe(true);
    expect(LifecycleScript.same(script.stateAt(0.6), script.stateAt(0.66))).toBe(false);
    expect(LifecycleScript.same(script.stateAt(0.36), script.stateAt(0.56))).toBe(false);
  });

  it("rejects an empty lifecycle", () => {
    expect(() => new LifecycleScript([], Roster.of(departments, []), 3)).toThrow(RangeError);
  });

  it("plays the site's own lifecycle end to end", () => {
    const { orchestra } = SITE;
    const site = new LifecycleScript(
      orchestra.steps,
      Roster.of(orchestra.departments, orchestra.steps),
      orchestra.principles.length,
    );
    const last = site.stateAt(1);
    expect(last.dispatched).toBe(orchestra.steps.length);
    expect(last.phase).toEqual({ kind: "holding", step: orchestra.steps.length - 1 });
    expect([...last.channels.values()].every((status) => status === "used")).toBe(true);
  });
});
