import { describe, expect, it } from "vitest";
import { TurnSpring } from "./TurnSpring";

const RULES = { reach: 0.5, perPixel: 0.01, stiffness: 55, damping: 10 } as const;

describe("TurnSpring", () => {
  it("rests at zero until grabbed", () => {
    const turn = new TurnSpring(RULES);
    turn.step(1);
    expect(turn.yaw()).toBe(0);
    expect(turn.resting()).toBe(true);
  });

  it("follows a drag, softly limited to its reach either way", () => {
    const turn = new TurnSpring(RULES);
    turn.grab();
    turn.drag(10);
    expect(turn.yaw()).toBeCloseTo(0.5 * Math.tanh(0.1 / 0.5), 12);
    turn.drag(10_000);
    expect(turn.yaw()).toBeLessThanOrEqual(0.5);
    expect(turn.yaw()).toBeGreaterThan(0.49);
    turn.drag(-10_000);
    expect(turn.yaw()).toBeGreaterThanOrEqual(-0.5);
  });

  it("holds still while held, and ignores a drag it was not grabbed for", () => {
    const turn = new TurnSpring(RULES);
    turn.drag(50);
    expect(turn.yaw()).toBe(0);
    turn.grab();
    turn.drag(30);
    const held = turn.yaw();
    turn.step(1);
    expect(turn.yaw()).toBe(held);
    expect(turn.held()).toBe(true);
  });

  it("springs back to rest after release, overshooting only a little", () => {
    const turn = new TurnSpring(RULES);
    turn.grab();
    turn.drag(40);
    const start = turn.yaw();
    turn.release();
    let lowest = start;
    for (let frame = 0; frame < 240; frame += 1) {
      turn.step(1 / 60);
      lowest = Math.min(lowest, turn.yaw());
    }
    expect(lowest).toBeLessThan(0);
    expect(lowest).toBeGreaterThan(-0.15 * start);
    expect(turn.resting()).toBe(true);
    expect(turn.yaw()).toBe(0);
  });

  it("moves the same however a long frame is sliced", () => {
    const once = new TurnSpring(RULES);
    const sliced = new TurnSpring(RULES);
    for (const turn of [once, sliced]) {
      turn.grab();
      turn.drag(30);
      turn.release();
    }
    once.step(0.1);
    for (let slice = 0; slice < 4; slice += 1) {
      sliced.step(0.025);
    }
    expect(sliced.yaw()).toBeCloseTo(once.yaw(), 6);
  });

  it("picks the island up where it is when grabbed mid-spring", () => {
    const turn = new TurnSpring(RULES);
    turn.grab();
    turn.drag(30);
    turn.release();
    turn.step(0.05);
    const there = turn.yaw();
    turn.grab();
    turn.drag(0);
    expect(turn.yaw()).toBeCloseTo(there, 9);
  });

  it("goes home at once when told, and refuses rules that cannot turn", () => {
    const turn = new TurnSpring(RULES);
    turn.grab();
    turn.drag(30);
    turn.release();
    turn.home();
    expect(turn.yaw()).toBe(0);
    expect(() => new TurnSpring({ ...RULES, reach: 0 })).toThrow();
    expect(() => new TurnSpring({ ...RULES, stiffness: 0 })).toThrow();
    expect(() => new TurnSpring({ ...RULES, damping: -1 })).toThrow();
  });
});
