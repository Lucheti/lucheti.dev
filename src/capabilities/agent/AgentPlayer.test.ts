import { describe, expect, it } from "vitest";
import { AGENT_TIMINGS, COMPACT_STAGE, WIDE_STAGE } from "./agentConfig";
import { AgentPlayer } from "./AgentPlayer";
import { AgentTimeline } from "./AgentTimeline";
import { ticketFixture } from "./fixtures";
import { RetryPlan } from "./RetryPlan";
import { StageLayout } from "./StageLayout";

const plan = new RetryPlan(3);
const tickets = [ticketFixture("A-1"), ticketFixture("B-2")];
const wide = new AgentTimeline(new StageLayout(WIDE_STAGE), tickets, plan, AGENT_TIMINGS);
const compact = new AgentTimeline(new StageLayout(COMPACT_STAGE), tickets, plan, AGENT_TIMINGS);

describe("AgentPlayer", () => {
  it("plays the timeline as time moves on", () => {
    const player = new AgentPlayer(wide, 0, "hi!", 1600);
    expect(player.frame().action.kind).toBe("pickup");
    player.advance(wide.momentAt("read", 0.5));
    expect(player.frame().action).toMatchObject({ kind: "work", at: "read" });
  });

  it("stops where it stands to wave and say hi, then carries on from the same place", () => {
    const start = wide.momentAt("search", 0.3);
    const player = new AgentPlayer(wide, start, "hi!", 1600);
    const before = player.frame();
    player.greet();
    expect(player.frame().action.kind).toBe("greet");
    expect(player.frame().bubble).toMatchObject({ text: "hi!", tone: "hello" });
    player.advance(800);
    expect(player.frame().position).toEqual(before.position);
    expect(player.frame().action).toMatchObject({ kind: "greet", progress: 0.5 });
    player.advance(800);
    expect(player.isGreeting()).toBe(false);
    expect(player.frame().action).toMatchObject({ kind: "work", at: "search" });
    expect(player.clock()).toBe(1600);
  });

  it("waits to land before waving when clicked mid-hop", () => {
    const hop = compact.timeAt({ episode: 0, step: 5, progress: 0.5 });
    const player = new AgentPlayer(compact, hop, "hi!", 1600);
    expect(player.frame().action).toMatchObject({ kind: "walk", airborne: true });
    player.greet();
    expect(player.isGreeting()).toBe(true);
    expect(player.frame().action.kind).toBe("walk");
    for (let i = 0; i < 40 && player.frame().action.kind !== "greet"; i += 1) {
      player.advance(16);
    }
    expect(player.frame().action.kind).toBe("greet");
    expect(player.frame().lift).toBe(0);
  });

  it("keeps its beat when the stage changes", () => {
    const player = new AgentPlayer(wide, wide.momentAt("test", 0.4), "hi!", 1600);
    player.stageOn(compact);
    expect(player.frame().action).toMatchObject({ kind: "work", at: "test" });
    expect(player.frame().action.progress).toBeCloseTo(0.4, 6);
  });

  it("refuses time running backwards and a greeting with no length", () => {
    expect(() => new AgentPlayer(wide, 0, "hi!", 0)).toThrow();
    expect(() => new AgentPlayer(wide, 0, "hi!", 1600).advance(-1)).toThrow();
  });
});
