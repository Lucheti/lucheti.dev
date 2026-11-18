import { describe, expect, it } from "vitest";
import type { FrameScheduler } from "./browser";
import { Cadence } from "./Cadence";
import { FrameLoop, type FrameListener } from "./FrameLoop";
import { GhostPresence } from "./GhostPresence";

describe("GhostPresence", () => {
  it("plays until the visitor comes in, and comes back a while after they leave", () => {
    const presence = new GhostPresence(4000);
    expect(presence.playing(0)).toBe(true);
    presence.enter();
    expect(presence.playing(100)).toBe(false);
    presence.leave(1000);
    expect(presence.playing(4999)).toBe(false);
    expect(presence.playing(5000)).toBe(true);
  });

  it("stays away if the visitor comes back before the wait is over", () => {
    const presence = new GhostPresence(4000);
    presence.enter();
    presence.leave(1000);
    presence.enter();
    expect(presence.playing(9000)).toBe(false);
  });

  it("refuses a negative wait", () => {
    expect(() => new GhostPresence(-1)).toThrow();
  });
});

describe("Cadence", () => {
  it("falls first after the lead-in, then once a period", () => {
    const cadence = new Cadence(1000, 300);
    expect(cadence.advance(299)).toBe(0);
    expect(cadence.advance(1)).toBe(1);
    expect(cadence.advance(999)).toBe(0);
    expect(cadence.advance(1)).toBe(1);
    expect(cadence.advance(2500)).toBe(2);
  });

  it("refuses a period of zero and time running backwards", () => {
    expect(() => new Cadence(0, 0)).toThrow();
    expect(() => new Cadence(1000, 0).advance(-1)).toThrow();
  });
});

/** Animation frames run by hand. */
class ManualFrames implements FrameScheduler {
  private pending: ((now: number) => void) | null = null;

  public request(callback: (now: number) => void): number {
    this.pending = callback;
    return 1;
  }

  public cancel(): void {
    this.pending = null;
  }

  public run(now: number): void {
    const callback = this.pending;
    this.pending = null;
    callback?.(now);
  }

  public waiting(): boolean {
    return this.pending !== null;
  }
}

/** Writes down what it was told. */
class Recorder implements FrameListener {
  public readonly steps: number[] = [];
  public halts = 0;

  public frame(_now: number, stepMs: number): void {
    this.steps.push(stepMs);
  }

  public halt(): void {
    this.halts += 1;
  }
}

describe("FrameLoop", () => {
  it("hands each frame's step to its listeners, the first as zero and none longer than a tenth of a second", () => {
    const frames = new ManualFrames();
    const recorder = new Recorder();
    const loop = new FrameLoop(frames, [recorder]);
    loop.start();
    frames.run(1000);
    frames.run(1016);
    frames.run(5000);
    expect(recorder.steps).toEqual([0, 16, 100]);
  });

  it("stops asking for frames and tells its listeners when stopped, and starts afresh", () => {
    const frames = new ManualFrames();
    const recorder = new Recorder();
    const loop = new FrameLoop(frames, [recorder]);
    loop.start();
    frames.run(0);
    loop.stop();
    expect(frames.waiting()).toBe(false);
    expect(recorder.halts).toBe(1);
    loop.start();
    frames.run(9000);
    expect(recorder.steps).toEqual([0, 0]);
  });
});
