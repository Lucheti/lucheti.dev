import { describe, expect, it } from "vitest";
import { BigButton, type Seconds, type Sender } from "./BigButton";
import { Waker } from "./kit";

class HandClock implements Seconds {
  public time = 10;
  public now(): number {
    return this.time;
  }
}

describe("BigButton", () => {
  it("sends its batch and times the press", () => {
    const sent: number[] = [];
    const sender: Sender = { send: (count) => sent.push(count) };
    const clock = new HandClock();
    const waker = new Waker();
    let woken = 0;
    waker.bind(() => {
      woken += 1;
    });
    const button = new BigButton(sender, 10, clock, waker);
    expect(button.age()).toBe(Number.POSITIVE_INFINITY);
    button.press();
    clock.time = 10.25;
    expect(sent).toEqual([10]);
    expect(button.age()).toBe(0.25);
    expect(woken).toBe(1);
  });

  it("sends at least one message", () => {
    expect(() => new BigButton({ send: () => undefined }, 0, new HandClock(), new Waker())).toThrow();
  });
});
