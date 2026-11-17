import { describe, expect, it } from "vitest";
import { AGENT_TIMINGS, COMPACT_STAGE, WIDE_STAGE } from "./agentConfig";
import { AgentTimeline, type AgentFrame } from "./AgentTimeline";
import { ticketFixture } from "./fixtures";
import { RetryPlan } from "./RetryPlan";
import { StageLayout } from "./StageLayout";

const tickets = [ticketFixture("A-1"), ticketFixture("B-2"), ticketFixture("C-3")];
const plan = new RetryPlan(1117);
const wide = new StageLayout(WIDE_STAGE);
const compact = new StageLayout(COMPACT_STAGE);
const timeline = new AgentTimeline(wide, tickets, plan, AGENT_TIMINGS);

/** Frames every `stepMs` from `from` to `to`. */
function sample(line: AgentTimeline, from: number, to: number, stepMs = 20): readonly AgentFrame[] {
  const frames: AgentFrame[] = [];
  for (let t = from; t < to; t += stepMs) {
    frames.push(line.frameAt(t));
  }
  return frames;
}

/** The first episode with a retry, found from the plan. */
function firstRetry(): number {
  let episode = 0;
  while (!plan.retries(episode)) {
    episode += 1;
  }
  return episode;
}

/** When `episode` starts. */
function startOf(episode: number): number {
  return timeline.timeAt({ episode, step: 0, progress: 0 });
}

describe("AgentTimeline", () => {
  it("takes about 14 s for a clean ticket and about 5 s more for a retry", () => {
    expect(timeline.episodeMs(false)).toBe(14000);
    expect(timeline.episodeMs(true) - timeline.episodeMs(false)).toBe(5300);
    const narrow = new AgentTimeline(compact, tickets, plan, AGENT_TIMINGS);
    expect(narrow.episodeMs(false)).toBeGreaterThan(12000);
    expect(narrow.episodeMs(false)).toBeLessThan(15000);
  });

  it("starts by picking up the first ticket at the inbox", () => {
    const frame = timeline.frameAt(0);
    expect(frame.action.kind).toBe("pickup");
    expect(frame.position).toEqual(wide.spot("inbox"));
    expect(frame.ticket.id).toBe("A-1");
    expect(frame.hold.kind).toBe("none");
    expect(frame.shipped).toBe(0);
    const later = timeline.frameAt(900);
    expect(later.hold.kind).toBe("held");
    expect(later.bubble).toMatchObject({ text: "A-1", result: "title A-1", tone: "ticket" });
  });

  it("moves smoothly: no jumps between frames 20 ms apart, across many tickets", () => {
    for (const line of [timeline, new AgentTimeline(compact, tickets, plan, AGENT_TIMINGS)]) {
      const frames = sample(line, 0, 130000, 20);
      for (let i = 1; i < frames.length; i += 1) {
        const a = frames[i - 1];
        const b = frames[i];
        const jump = Math.hypot(b.position.x - a.position.x, b.position.y - a.position.y - (b.lift - a.lift));
        expect(jump).toBeLessThan(12);
      }
    }
  });

  it("lights a station only while the agent stands at it", () => {
    for (const frame of sample(timeline, 0, 60000, 50)) {
      if (frame.lit === null) {
        expect(frame.action.kind).toBe("walk");
      } else {
        expect(frame.position).toEqual(wide.spot(frame.lit));
      }
    }
  });

  it("shows each tool call in a bubble, with the test result once the run finishes", () => {
    const reading = timeline.frameAt(timeline.momentAt("read", 0.5));
    expect(reading.action).toMatchObject({ kind: "work", at: "read" });
    expect(reading.bubble).toMatchObject({ text: "read A-1", result: null, tone: "call" });
    expect(timeline.frameAt(timeline.momentAt("read", 0.05)).bubble).toBeNull();
    const testing = timeline.frameAt(timeline.momentAt("test", 0.3));
    expect(testing.bubble).toMatchObject({ text: "test A-1", result: null });
    const passed = timeline.frameAt(timeline.momentAt("test", 0.8));
    expect(passed.bubble).toMatchObject({ result: "9 passed", tone: "passed" });
  });

  it("takes the tickets in turn and counts each one shipped exactly once", () => {
    const ids = [0, 1, 2, 3, 4].map((episode) => timeline.frameAt(startOf(episode) + 10).ticket.id);
    expect(ids).toEqual(["A-1", "B-2", "C-3", "A-1", "B-2"]);
    let shipped = 0;
    for (const frame of sample(timeline, 0, 120000, 25)) {
      expect(frame.shipped - shipped === 0 || frame.shipped - shipped === 1).toBe(true);
      shipped = frame.shipped;
    }
    expect(shipped).toBeGreaterThanOrEqual(7);
  });

  it("drops the ticket into Ship, then plays the pop", () => {
    const frames = sample(timeline, 0, timeline.episodeMs(false), 10).filter((frame) => frame.action.kind === "ship");
    const dropping = frames.filter((frame) => frame.hold.kind === "dropping");
    const popping = frames.filter((frame) => frame.pop !== null);
    expect(dropping.length).toBeGreaterThan(0);
    expect(popping.length).toBeGreaterThan(0);
    expect(dropping.every((frame) => frame.pop === null && !frame.delivered)).toBe(true);
    expect(popping.every((frame) => frame.delivered && frame.shipped === 1)).toBe(true);
  });

  it("on a retry fails the test, shakes its head, goes back to Code and then passes", () => {
    const episode = firstRetry();
    const frames = sample(timeline, startOf(episode), startOf(episode + 1), 20);
    const order: string[] = [];
    for (const frame of frames) {
      const label =
        frame.action.kind === "work"
          ? `${frame.action.at}:${frame.action.outcome}`
          : frame.action.kind === "shake"
            ? "shake"
            : null;
      if (label !== null && order.at(-1) !== label) {
        order.push(label);
      }
    }
    expect(order).toEqual(["read:done", "search:done", "code:done", "test:failed", "shake", "code:fixed", "test:passed"]);
    const shaking = frames.find((frame) => frame.action.kind === "shake");
    expect(shaking?.bubble).toMatchObject({ result: "1 failed", tone: "failed" });
  });

  it("finds its place again after the stage changes", () => {
    const narrow = new AgentTimeline(compact, tickets, plan, AGENT_TIMINGS);
    for (const t of [0, 3300, 9000, 15500, 47000, 123456]) {
      const cursor = timeline.cursorAt(t);
      const there = narrow.timeAt(cursor);
      expect(narrow.cursorAt(there).episode).toBe(cursor.episode);
      expect(narrow.cursorAt(there).step).toBe(cursor.step);
      expect(timeline.timeAt(cursor)).toBeCloseTo(t, 6);
    }
  });

  it("looks down at its desk while working and toward the next station before leaving", () => {
    expect(timeline.frameAt(timeline.momentAt("search", 0.4)).look).toEqual({ x: 0, y: 1 });
    expect(timeline.frameAt(timeline.momentAt("search", 0.9)).look).toEqual({ x: 1, y: 0 });
  });

  it("refuses negative time and an empty ticket list", () => {
    expect(() => timeline.frameAt(-1)).toThrow();
    expect(() => new AgentTimeline(wide, [], plan, AGENT_TIMINGS)).toThrow();
  });
});
