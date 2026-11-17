import { describe, expect, it } from "vitest";
import { DioramaState } from "./DioramaState";
import { Reactions, type Clock } from "./Reactions";
import { Switchboard, Waker } from "./Switchboard";
import { allTargets } from "./Target";

class FakeClock implements Clock {
  private seconds = 100;

  public now(): number {
    return this.seconds;
  }

  public pass(seconds: number): void {
    this.seconds += seconds;
  }
}

function rig(): Readonly<{ state: DioramaState; reactions: Reactions; clock: FakeClock; board: Switchboard; wakes: () => number }> {
  const clock = new FakeClock();
  const state = new DioramaState();
  const reactions = new Reactions(clock);
  const waker = new Waker();
  let wakes = 0;
  waker.bind(() => {
    wakes += 1;
  });
  return { state, reactions, clock, board: new Switchboard(state, reactions, waker), wakes: () => wakes };
}

describe("Switchboard", () => {
  it("drives the screen from the pegboard and switches the lamp", () => {
    const { state, board } = rig();
    board.press({ kind: "toggle" });
    board.press({ kind: "button" });
    board.press({ kind: "slider" });
    board.press({ kind: "star", count: 5 });
    board.press({ kind: "checkbox" });
    board.press({ kind: "lamp" });
    expect(state.snapshot()).toMatchObject({ theme: "dark", toasts: 1, density: "roomy", rating: 5, done: true, lampOn: false });
  });

  it("leaves the screen alone for the props that only react", () => {
    const { state, board } = rig();
    const before = state.snapshot();
    board.press({ kind: "duck" });
    board.press({ kind: "plant" });
    board.press({ kind: "card" });
    expect(state.snapshot()).toBe(before);
  });

  it("starts every clicked thing's reaction, and asks for a frame each time", () => {
    const { reactions, clock, board, wakes } = rig();
    for (const target of allTargets()) {
      expect(reactions.age(target.kind)).toBe(Number.POSITIVE_INFINITY);
    }
    allTargets().forEach((target) => board.press(target));
    clock.pass(0.5);
    expect(reactions.age("duck")).toBeCloseTo(0.5, 9);
    expect(reactions.lively()).toBe(true);
    clock.pass(5);
    expect(reactions.lively()).toBe(false);
    expect(wakes()).toBe(allTargets().length);
  });

  it("asks nobody for frames once the canvas is gone", () => {
    const waker = new Waker();
    let wakes = 0;
    waker.bind(() => {
      wakes += 1;
    });
    waker.unbind();
    waker.wake();
    expect(wakes).toBe(0);
  });
});
