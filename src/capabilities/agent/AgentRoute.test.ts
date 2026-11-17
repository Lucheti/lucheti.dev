import { describe, expect, it } from "vitest";
import type { AgentStationId } from "@/content";
import { AgentRoute, type RouteStep } from "./AgentRoute";
import { ticketFixture } from "./fixtures";

/** Where the agent stands after each step, starting at the inbox; fails if a walk starts somewhere else. */
function stopsOf(steps: readonly RouteStep[]): readonly AgentStationId[] {
  let at: AgentStationId = "inbox";
  const stops: AgentStationId[] = [];
  for (const step of steps) {
    if (step.kind === "walk") {
      expect(step.from).toBe(at);
      at = step.to;
      stops.push(at);
    }
  }
  return stops;
}

describe("AgentRoute", () => {
  const ticket = ticketFixture("F-1");

  it("takes a clean ticket through every tool, ships it and walks home", () => {
    const steps = new AgentRoute(ticket, false).steps();
    expect(steps[0]).toEqual({ kind: "pickup" });
    expect(stopsOf(steps)).toEqual(["read", "search", "code", "test", "ship", "inbox"]);
    expect(steps.filter((step) => step.kind === "shake")).toHaveLength(0);
    expect(steps.at(-2)).toEqual({ kind: "ship" });
  });

  it("makes the calls of its own ticket", () => {
    const calls = new AgentRoute(ticket, false)
      .steps()
      .flatMap((step) => (step.kind === "work" ? [step.call.call] : []));
    expect(calls).toEqual(["read F-1", "search F-1", "edit F-1", "test F-1"]);
  });

  it("on a retry fails, shakes its head, goes back to fix the code, then passes", () => {
    const steps = new AgentRoute(ticket, true).steps();
    expect(stopsOf(steps)).toEqual(["read", "search", "code", "test", "code", "test", "ship", "inbox"]);
    const outcomes = steps.flatMap((step) => (step.kind === "work" ? [`${step.at}:${step.outcome}`] : []));
    expect(outcomes).toEqual(["read:done", "search:done", "code:done", "test:failed", "code:fixed", "test:passed"]);
    const failed = steps.findIndex((step) => step.kind === "work" && step.outcome === "failed");
    expect(steps[failed + 1]).toEqual({ kind: "shake", call: ticket.failure });
  });
});
