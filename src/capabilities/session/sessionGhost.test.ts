import { describe, expect, it } from "vitest";
import type { SessionPromptId } from "@/content";
import type { FrameListener } from "@/laptop";
import { GhostScript, type Locator } from "@/laptop/GhostScript";
import { PatientGhost, SessionHands, SessionMarks, sessionGhostLoop, type SessionEffect, type SessionTarget } from "./sessionGhost";
import type { SessionActions } from "./SessionRunner";
import type { RunDriver } from "./stream";

const locate: Locator<SessionTarget> = (target) => (target.kind === "chip" ? { x: 400, y: 70 } : { x: 470, y: 380 });

/** Writes down what the ghost did. */
class Ledger implements SessionActions {
  public readonly done: string[] = [];

  public start(prompt: SessionPromptId, driver: RunDriver): void {
    this.done.push(`${driver} ${prompt}`);
  }
}

describe("the session's ghost loop", () => {
  const order: readonly SessionPromptId[] = ["slow-page", "tests", "dark-mode"];
  const watch = 30_000;
  const script = new GhostScript<SessionTarget, SessionEffect>(sessionGhostLoop(order, watch));

  it("starts each prompt once a loop, in order", () => {
    expect(script.effectsBetween(0, script.duration())).toEqual(order.map((prompt) => ({ kind: "start", prompt })));
  });

  it("watches each run for the time it is given before the next click", () => {
    const clicks: number[] = [];
    for (let time = 0; time < script.duration(); time += 10) {
      if (script.effectsBetween(time, time + 10).length > 0) {
        clicks.push(time);
      }
    }
    expect(clicks[1] - clicks[0]).toBeGreaterThanOrEqual(watch);
  });

  it("hovers the chip before it clicks it, then steps back to rest", () => {
    const hovering = script.frameAt(3400, locate);
    expect(hovering.over).toEqual({ kind: "chip", prompt: "slow-page" });
    expect(hovering.pressed).toBe(false);
    expect(script.frameAt(8000, locate).over).toEqual({ kind: "rest" });
  });

  it("refuses an empty order, or a watch shorter than stepping back", () => {
    expect(() => sessionGhostLoop([], watch)).toThrow();
    expect(() => sessionGhostLoop(order, 1000)).toThrow();
  });

  it("starts runs as the ghost", () => {
    const ledger = new Ledger();
    const hands = new SessionHands(ledger);
    hands.apply({ kind: "start", prompt: "tests" });
    hands.tidy();
    hands.letGo();
    expect(ledger.done).toEqual(["ghost tests"]);
  });
});

describe("SessionMarks", () => {
  const marks = new SessionMarks();

  it("names each place the way the window marks it", () => {
    expect(marks.keyOf({ kind: "chip", prompt: "dark-mode" })).toBe("chip-dark-mode");
    expect(marks.keyOf(marks.rest)).toBe("rest");
  });

  it("aims a little left of a chip's middle, over its words", () => {
    const aim = marks.aim({ kind: "chip", prompt: "tests" }, { width: 100, height: 26 });
    expect(aim.x).toBe(42);
    expect(aim.y).toBeCloseTo(15.08);
  });
});

/** Writes down the frames it is given. */
class Tape implements FrameListener {
  public readonly calls: string[] = [];

  public frame(_now: number, step: number): void {
    this.calls.push(`frame ${step}`);
  }

  public halt(): void {
    this.calls.push("halt");
  }
}

describe("PatientGhost", () => {
  it("halts the ghost while the visitor's run is on screen, and plays it otherwise", () => {
    let watching = true;
    const tape = new Tape();
    const ghost = new PatientGhost(tape, { visitorWatching: () => watching }, 6000);
    ghost.frame(0, 16);
    watching = false;
    ghost.frame(16, 16);
    ghost.halt();
    expect(tape.calls).toEqual(["halt", "frame 16", "halt"]);
  });
});
