import { describe, expect, it } from "vitest";
import { DioramaState } from "./DioramaState";

describe("DioramaState", () => {
  it("starts light, cosy, rated three stars, not done, with the lamp on", () => {
    const view = new DioramaState().snapshot();
    expect(view).toEqual({ theme: "light", toasts: 0, density: "cosy", rating: 3, done: false, lampOn: true, arrivals: 0 });
  });

  it("flips the theme and the lamp back and forth, and ticks the task done and undone", () => {
    const state = new DioramaState();
    state.flipTheme();
    state.switchLamp();
    state.toggleDone();
    expect(state.snapshot()).toMatchObject({ theme: "dark", lampOn: false, done: true });
    state.flipTheme();
    state.switchLamp();
    state.toggleDone();
    expect(state.snapshot()).toMatchObject({ theme: "light", lampOn: true, done: false });
  });

  it("steps the density round, from the biggest back to the smallest", () => {
    const state = new DioramaState();
    const seen = [state.snapshot().density];
    for (let step = 0; step < 3; step += 1) {
      state.stepDensity();
      seen.push(state.snapshot().density);
    }
    expect(seen).toEqual(["cosy", "roomy", "snug", "cosy"]);
  });

  it("rates the task, clears it when its rating is clicked again, and refuses a rating out of range", () => {
    const state = new DioramaState();
    state.rate(5);
    expect(state.snapshot().rating).toBe(5);
    state.rate(5);
    expect(state.snapshot().rating).toBe(0);
    expect(() => state.rate(0)).toThrow();
    expect(() => state.rate(6)).toThrow();
    expect(() => state.rate(2.5)).toThrow();
  });

  it("counts toasts and arrivals", () => {
    const state = new DioramaState();
    state.popToast();
    state.popToast();
    state.receive();
    expect(state.snapshot()).toMatchObject({ toasts: 2, arrivals: 1 });
  });

  it("keeps the same view until something changes, and tells listeners until they stop", () => {
    const state = new DioramaState();
    const first = state.snapshot();
    expect(state.snapshot()).toBe(first);
    let calls = 0;
    const stop = state.subscribe(() => {
      calls += 1;
    });
    state.popToast();
    expect(state.snapshot()).not.toBe(first);
    stop();
    state.popToast();
    expect(calls).toBe(1);
  });
});
