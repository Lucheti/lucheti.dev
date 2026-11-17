import { describe, expect, it } from "vitest";
import { AGENT_TIMINGS, WIDE_STAGE } from "./agentConfig";
import { AgentPoser } from "./AgentPose";
import { AgentTimeline, type AgentAction, type AgentFrame } from "./AgentTimeline";
import { ticketFixture } from "./fixtures";
import { RetryPlan } from "./RetryPlan";
import { StageLayout } from "./StageLayout";

const timeline = new AgentTimeline(new StageLayout(WIDE_STAGE), [ticketFixture("A-1")], new RetryPlan(5), AGENT_TIMINGS);
const live = new AgentPoser(false);
const still = new AgentPoser(true);

/** A frame from the timeline with its action swapped for `action`. */
function framed(action: AgentAction, stride = 0): AgentFrame {
  return { ...timeline.frameAt(0), action, stride };
}

describe("AgentPoser", () => {
  it("blinks now and then, and keeps its eyes open most of the time", () => {
    const frame = timeline.frameAt(timeline.momentAt("read", 0.5));
    const openness = Array.from({ length: 1000 }, (_, i) => live.pose(frame, i * 10).eyes.open);
    const shut = openness.filter((open) => open < 0.5).length;
    expect(shut).toBeGreaterThan(0);
    expect(shut / openness.length).toBeLessThan(0.15);
  });

  it("bobs and lifts its feet in turn while walking", () => {
    const step = live.pose(framed({ kind: "walk", airborne: false, progress: 0.5, elapsedMs: 300 }, 0.5), 0);
    expect(step.bob).toBeGreaterThan(2);
    expect(step.feet[0]).toBeGreaterThan(0);
    expect(step.feet[1]).toBe(0);
    const next = live.pose(framed({ kind: "walk", airborne: false, progress: 0.5, elapsedMs: 300 }, 1.5), 0);
    expect(next.feet[1]).toBeGreaterThan(0);
    expect(next.feet[0]).toBe(0);
  });

  it("hops on arrival, then settles and pulses its antenna while it thinks", () => {
    const arriving = live.pose(framed({ kind: "work", at: "code", outcome: "done", progress: 0.07, elapsedMs: 130 }), 0);
    expect(arriving.bob).toBeGreaterThan(5);
    const glows = [0, 155, 310, 465].map(
      (clock) => live.pose(framed({ kind: "work", at: "code", outcome: "done", progress: 0.5, elapsedMs: 900 }), clock).glow,
    );
    expect(Math.max(...glows) - Math.min(...glows)).toBeGreaterThan(0.5);
  });

  it("shakes its head after a failed test", () => {
    const tilts = [0.08, 0.25, 0.42].map((progress) => live.pose(framed({ kind: "shake", progress, elapsedMs: 0 }), 0).tilt);
    expect(Math.max(...tilts)).toBeGreaterThan(4);
    expect(Math.min(...tilts)).toBeLessThan(-3);
  });

  it("jumps with happy eyes and arms up when it ships, then squashes on landing", () => {
    const jump = live.pose(framed({ kind: "ship", progress: 0.46, elapsedMs: 0 }), 0);
    expect(jump.bob).toBeGreaterThan(6);
    expect(jump.eyes.happy).toBe(true);
    expect(jump.arms.left).toBeGreaterThan(120);
    const landing = live.pose(framed({ kind: "ship", progress: 0.63, elapsedMs: 0 }), 0);
    expect(landing.scale.y).toBeLessThan(0.9);
  });

  it("waves its right arm to say hi", () => {
    const angles = [0.05, 0.1, 0.15].map((progress) => live.pose(framed({ kind: "greet", progress, elapsedMs: 0 }), 0).arms.right);
    expect(Math.min(...angles)).toBeGreaterThan(110);
    expect(Math.max(...angles) - Math.min(...angles)).toBeGreaterThan(10);
  });

  it("holds the ticket in front with both arms, but still waves with the right", () => {
    const carrying: AgentFrame = { ...framed({ kind: "walk", airborne: false, progress: 0.5, elapsedMs: 0 }, 0.5), hold: { kind: "held" } };
    const walking = live.pose(carrying, 0);
    expect(walking.arms.left).toBeLessThan(0);
    expect(walking.arms.right).toBeLessThan(0);
    const waving = live.pose({ ...carrying, action: { kind: "greet", progress: 0.05, elapsedMs: 0 } }, 0);
    expect(waving.arms.left).toBeLessThan(0);
    expect(waving.arms.right).toBeGreaterThan(110);
  });

  it("holds one calm pose when still: no bob, no blink, no wobble, a raised arm to wave", () => {
    const walking = still.pose(framed({ kind: "walk", airborne: false, progress: 0.5, elapsedMs: 300 }, 0.5), 1650);
    expect(walking.bob).toBe(0);
    expect(walking.feet).toEqual([0, 0]);
    expect(walking.eyes.open).toBe(1);
    const waves = [0.05, 0.1].map((progress) => still.pose(framed({ kind: "greet", progress, elapsedMs: 0 }), 0).arms.right);
    expect(waves[0]).toBe(waves[1]);
    expect(waves[0]).toBeGreaterThan(110);
  });
});
