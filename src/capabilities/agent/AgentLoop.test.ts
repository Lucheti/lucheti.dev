import { describe, expect, it } from "vitest";
import type { AgentPanel } from "@/content";
import type { FrameScheduler } from "./AgentLoop";
import { composeAgentToy } from "./composeAgentToy";
import { ticketFixture } from "./fixtures";

/** Frames that only come when the test says so. */
class HandFrames implements FrameScheduler {
  private waiting: ((now: number) => void) | null = null;
  private time = 0;

  public request(callback: (now: number) => void): number {
    this.waiting = callback;
    return 1;
  }

  public cancel(): void {
    this.waiting = null;
  }

  public pending(): boolean {
    return this.waiting !== null;
  }

  /** Runs the waiting frame `ms` after the last one. */
  public step(ms: number): void {
    const callback = this.waiting;
    this.waiting = null;
    this.time += ms;
    callback?.(performance.now() + this.time);
  }
}

const panel: AgentPanel = {
  label: "",
  title: "Agent at work",
  caption: "",
  stations: { inbox: "Inbox", read: "Read", search: "Search", code: "Code", test: "Test", ship: "Ship" },
  tickets: [ticketFixture("A-1")],
  shipped: "Shipped",
  greeting: "hi!",
  greet: "Say hi",
  greeted: "It waves.",
};

describe("AgentLoop", () => {
  it("starts at Code, part way through the first edit", () => {
    const { loop } = composeAgentToy(panel, new HandFrames());
    expect(loop.view().frame.action).toMatchObject({ kind: "work", at: "code" });
    expect(loop.view().frame.bubble).toMatchObject({ text: "edit A-1" });
    expect(loop.view().stage).toBe("wide");
  });

  it("asks for frames only while playing, and tells its listeners each frame", () => {
    const frames = new HandFrames();
    const { loop } = composeAgentToy(panel, frames);
    let heard = 0;
    loop.subscribe(() => {
      heard += 1;
    });
    expect(frames.pending()).toBe(false);
    loop.play();
    expect(frames.pending()).toBe(true);
    frames.step(16);
    frames.step(16);
    expect(heard).toBe(2);
    expect(loop.view().clockMs).toBeGreaterThan(0);
    loop.pause();
    expect(frames.pending()).toBe(false);
  });

  it("waves even when paused, and stops asking for frames once the wave is over", () => {
    const frames = new HandFrames();
    const { loop } = composeAgentToy(panel, frames);
    const before = loop.view().frame.position;
    loop.greet();
    expect(loop.view().frame.action.kind).toBe("greet");
    for (let i = 0; i < 30 && frames.pending(); i += 1) {
      frames.step(100);
    }
    expect(frames.pending()).toBe(false);
    expect(loop.view().frame.action.kind).toBe("work");
    expect(loop.view().frame.position).toEqual(before);
  });

  it("moves the agent to the compact stage without losing its place", () => {
    const toy = composeAgentToy(panel, new HandFrames());
    toy.loop.showStage("compact");
    expect(toy.loop.view().stage).toBe("compact");
    expect(toy.loop.view().frame.position).toEqual(toy.layouts.compact.spot("code"));
  });
});
