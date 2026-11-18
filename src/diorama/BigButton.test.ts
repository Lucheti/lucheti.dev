import { describe, expect, it } from "vitest";
import { BigButton, type Trigger } from "./BigButton";
import type { Seconds } from "./Seconds";
import { Waker } from "./Switchboard";

class HandClock implements Seconds {
  public time = 10;
  public now(): number {
    return this.time;
  }
}

describe("BigButton", () => {
  it("sets off its trigger and times the press", () => {
    let fired = 0;
    const trigger: Trigger = { fire: () => (fired += 1) };
    const clock = new HandClock();
    const waker = new Waker();
    let woken = 0;
    waker.bind(() => {
      woken += 1;
    });
    const button = new BigButton(trigger, clock, waker);
    expect(button.age()).toBe(Number.POSITIVE_INFINITY);
    button.press();
    clock.time = 10.25;
    expect(fired).toBe(1);
    expect(button.age()).toBe(0.25);
    expect(woken).toBe(1);
  });
});
