import { describe, expect, it } from "vitest";
import type { SagaStep } from "@/content";
import { ANIMATED_TIMING, idleFrame, SagaSequencer, STEPPED_TIMING } from "./SagaSequencer";

const STEPS: readonly SagaStep[] = [
  { service: "Orders", action: "Create order", compensation: "Cancel order" },
  { service: "Payments", action: "Charge card", compensation: "Refund" },
  { service: "Inventory", action: "Reserve stock", compensation: "Release stock" },
  { service: "Shipping", action: "Book courier", compensation: "" },
];

const LABELS = { client: "Client", gateway: "Gateway", orchestrator: "Orchestrator" };

function lines(sequencer: SagaSequencer): readonly string[] {
  return sequencer
    .frameAt(sequencer.durationMs)
    .log.map((entry) => (entry.detail === "" ? entry.route : `${entry.route}  ${entry.detail}`));
}

describe("SagaSequencer happy path", () => {
  const sequencer = new SagaSequencer(STEPS, null, LABELS, ANIMATED_TIMING);

  it("starts idle before time zero", () => {
    expect(sequencer.frameAt(-1)).toEqual(idleFrame(4));
  });

  it("commits every step and reports the committed outcome", () => {
    const end = sequencer.frameAt(sequencer.durationMs);
    expect(end.statuses).toEqual(["done", "done", "done", "done"]);
    expect(end.outcome).toBe("committed");
  });

  it("visits the services in order", () => {
    const calls = lines(sequencer).filter((line) => line.startsWith("Orchestrator →"));
    expect(calls).toEqual([
      "Orchestrator → Orders  Create order",
      "Orchestrator → Payments  Charge card",
      "Orchestrator → Inventory  Reserve stock",
      "Orchestrator → Shipping  Book courier",
    ]);
  });

  it("starts with the two edge hops", () => {
    expect(lines(sequencer).slice(0, 2)).toEqual(["Client → Gateway", "Gateway → Orchestrator  JWT verified"]);
  });

  it("moves the token client, gateway, orchestrator, then out and back per service", () => {
    const legs: string[] = [];
    for (let t = 0; t < sequencer.durationMs; t += 5) {
      const segment = sequencer.segmentAt(t);
      const leg = segment ? `${segment.from}>${segment.to}` : null;
      if (leg !== null && legs[legs.length - 1] !== leg) {
        legs.push(leg);
      }
    }
    expect(legs.slice(0, 6)).toEqual([
      "client>gateway",
      "gateway>orchestrator",
      "orchestrator>service:0",
      "service:0>orchestrator",
      "orchestrator>service:1",
      "service:1>orchestrator",
    ]);
    expect(legs).toHaveLength(2 + 4 * 2);
  });

  it("shows a service as running while it works", () => {
    const hopsBefore = ANIMATED_TIMING.ingressMs * 2 + ANIMATED_TIMING.hopMs;
    const working = sequencer.frameAt(hopsBefore + ANIMATED_TIMING.workMs / 2);
    expect(working.statuses[0]).toBe("running");
    expect(working.statuses[1]).toBe("idle");
  });
});

describe("SagaSequencer failure path", () => {
  const sequencer = new SagaSequencer(STEPS, 2, LABELS, ANIMATED_TIMING);
  const end = sequencer.frameAt(sequencer.durationMs);

  it("fails the chosen step and never starts the ones after it", () => {
    expect(end.statuses[2]).toBe("failed");
    expect(end.statuses[3]).toBe("idle");
    expect(lines(sequencer).some((line) => line.includes("Shipping"))).toBe(false);
  });

  it("compensates the completed steps in reverse order", () => {
    const undo = end.log.filter((entry) => entry.tone === "compensation").map((entry) => entry.detail);
    expect(undo).toEqual(["Refund", "Cancel order"]);
  });

  it("logs the failure before the first compensation", () => {
    const text = lines(sequencer);
    expect(text.indexOf("Inventory  ✕ failed")).toBeGreaterThan(-1);
    expect(text.indexOf("Inventory  ✕ failed")).toBeLessThan(text.indexOf("Orchestrator → Payments  Refund"));
  });

  it("ends rolled back with the undone steps compensated", () => {
    expect(end.statuses).toEqual(["compensated", "compensated", "failed", "idle"]);
    expect(end.outcome).toBe("rolledBack");
  });

  it("sends orange tokens during compensation only", () => {
    const tones = new Set<string>();
    for (let t = 0; t < sequencer.durationMs; t += 5) {
      const segment = sequencer.segmentAt(t);
      if (segment?.tone === "compensation") {
        tones.add(`${segment.from}>${segment.to}`);
      }
    }
    expect([...tones]).toEqual(["orchestrator>service:1", "service:1>orchestrator", "orchestrator>service:0", "service:0>orchestrator"]);
  });

  it("skips steps whose compensation is empty", () => {
    const lateFailure = new SagaSequencer(STEPS, 3, LABELS, STEPPED_TIMING);
    const undo = lateFailure
      .frameAt(lateFailure.durationMs)
      .log.filter((entry) => entry.tone === "compensation")
      .map((entry) => entry.detail);
    expect(undo).toEqual(["Release stock", "Refund", "Cancel order"]);

    const emptyLast: readonly SagaStep[] = [STEPS[0], { service: "Audit", action: "Record", compensation: "" }, STEPS[1]];
    const skipped = new SagaSequencer(emptyLast, 2, LABELS, STEPPED_TIMING);
    const frame = skipped.frameAt(skipped.durationMs);
    expect(frame.log.filter((entry) => entry.tone === "compensation").map((entry) => entry.detail)).toEqual(["Cancel order"]);
    expect(frame.statuses).toEqual(["compensated", "done", "failed"]);
  });

  it("rolls back a first-step failure with nothing to undo", () => {
    const first = new SagaSequencer(STEPS, 0, LABELS, STEPPED_TIMING);
    const frame = first.frameAt(first.durationMs);
    expect(frame.statuses).toEqual(["failed", "idle", "idle", "idle"]);
    expect(frame.outcome).toBe("rolledBack");
  });
});

describe("SagaSequencer stepped timing", () => {
  it("never shows a travelling token and changes status every 400ms", () => {
    const sequencer = new SagaSequencer(STEPS, null, LABELS, STEPPED_TIMING);
    for (let t = 0; t <= sequencer.durationMs; t += 50) {
      expect(sequencer.segmentAt(t)).toBeNull();
    }
    expect(sequencer.durationMs).toBe(STEPS.length * STEPPED_TIMING.workMs);
    expect(sequencer.frameAt(0).statuses[0]).toBe("running");
    expect(sequencer.frameAt(400).statuses[0]).toBe("done");
  });
});

describe("SagaSequencer guards", () => {
  it("rejects an empty saga", () => {
    expect(() => new SagaSequencer([], null, LABELS, ANIMATED_TIMING)).toThrow();
  });

  it("rejects a failing step outside the saga", () => {
    expect(() => new SagaSequencer(STEPS, 4, LABELS, ANIMATED_TIMING)).toThrow();
    expect(() => new SagaSequencer(STEPS, -1, LABELS, ANIMATED_TIMING)).toThrow();
  });

  it("returns the same frame object while nothing changes", () => {
    const sequencer = new SagaSequencer(STEPS, null, LABELS, ANIMATED_TIMING);
    expect(sequencer.frameAt(1)).toBe(sequencer.frameAt(2));
  });
});
