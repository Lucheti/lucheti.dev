import { describe, expect, it } from "vitest";
import { OFFICE_TIMING } from "./composeOffice";
import { RoutePlanner } from "./RoutePlanner";
import { headingOf, stationOf } from "./TicketRoute";
import type { LegKind, StationId } from "./types";

const planner = new RoutePlanner(OFFICE_TIMING);

/** The kinds of step a route takes, in order. */
function kinds(bounces: number): LegKind[] {
  const route = planner.plan(bounces);
  const seen: LegKind[] = [];
  for (let at = 0; at < route.length(); at += 0.05) {
    const { leg } = route.at(at);
    if (seen.at(-1) !== leg.kind) {
      seen.push(leg.kind);
    }
  }
  return seen;
}

describe("TicketRoute", () => {
  it("takes a ticket from Product through Design, a three-way build and QA to the rocket", () => {
    expect(kinds(0)).toEqual(["stamp", "travel", "sketch", "travel", "split", "type", "join", "travel", "inspect", "verdict", "travel", "launch"]);
  });

  it("sends a ticket QA turns down back to Engineering for another round before it passes", () => {
    const route = planner.plan(1);
    expect(route.bounces()).toBe(1);
    expect(kinds(1)).toEqual([
      "stamp",
      "travel",
      "sketch",
      "travel",
      "split",
      "type",
      "join",
      "travel",
      "inspect",
      "verdict",
      "bounce",
      "split",
      "type",
      "join",
      "travel",
      "inspect",
      "verdict",
      "travel",
      "launch",
    ]);
    const verdicts: boolean[] = [];
    for (let index = 0; ; index += 1) {
      const leg = route.leg(index);
      if (leg.kind === "verdict") {
        verdicts.push(leg.pass);
      }
      if (leg.kind === "launch") {
        break;
      }
    }
    expect(verdicts).toEqual([false, true]);
  });

  it("is a pure function of time: progress runs 0 to 1 through each step, and the trip ends after its length", () => {
    const route = planner.plan(0);
    const total = Object.values(OFFICE_TIMING).reduce((sum, seconds) => sum + seconds, 0) - OFFICE_TIMING.bounce + 3 * OFFICE_TIMING.travel;
    expect(route.length()).toBeCloseTo(total, 6);
    expect(route.at(0)).toEqual({ leg: { kind: "stamp" }, index: 0, progress: 0 });
    expect(route.at(OFFICE_TIMING.stamp / 2).progress).toBeCloseTo(0.5, 6);
    expect(route.at(OFFICE_TIMING.stamp + 0.1).leg).toEqual({ kind: "travel", from: "product", to: "design" });
    expect(route.at(route.length() + 5).leg.kind).toBe("launch");
    expect(route.over(route.length() - 0.01)).toBe(false);
    expect(route.over(route.length())).toBe(true);
  });

  it("knows when it first reaches and last leaves each station, the second visit to Engineering included", () => {
    const once = planner.plan(0);
    const twice = planner.plan(1);
    expect(once.firstArrival("product")).toBe(0);
    expect(once.lastLeave("product")).toBeCloseTo(OFFICE_TIMING.stamp, 6);
    expect(twice.firstArrival("engineering")).toBeCloseTo(once.firstArrival("engineering") ?? Number.NaN, 6);
    expect((twice.lastLeave("engineering") ?? 0) - (once.lastLeave("engineering") ?? 0)).toBeGreaterThan(OFFICE_TIMING.type);
  });

  it("keeps a follower clear of the ticket ahead at every station", () => {
    const ahead = planner.plan(1);
    const next = planner.plan(0);
    const margin = 0.4;
    const start = ahead.earliestFollower(10, next, margin);
    expect(start).toBeGreaterThan(10);
    for (const station of ["product", "design", "engineering", "qa", "release"] as StationId[]) {
      expect(start + (next.firstArrival(station) ?? 0)).toBeGreaterThanOrEqual(10 + (ahead.lastLeave(station) ?? 0) + margin - 1e-9);
    }
  });

  it("names the station each step plays at, and where a trip is heading", () => {
    expect(stationOf({ kind: "split" })).toBe("engineering");
    expect(stationOf({ kind: "travel", from: "qa", to: "release" })).toBeNull();
    expect(headingOf({ kind: "travel", from: "qa", to: "release" })).toBe("release");
    expect(headingOf({ kind: "bounce" })).toBe("engineering");
    expect(headingOf({ kind: "verdict", pass: false })).toBe("qa");
  });

  it("refuses a route with no steps or a step that takes no time", () => {
    expect(() => planner.plan(-1)).toThrow();
    expect(() => new RoutePlanner({ ...OFFICE_TIMING, stamp: 0 }).plan(0)).toThrow();
  });
});
