import { describe, expect, it } from "vitest";
import { ManualClock } from "./Clock";
import { composeQueueToy } from "./composeQueueToy";
import type { FramePainter } from "./FlightPainter";
import { QueueLoop, type FrameScheduler } from "./QueueLoop";
import { QueueSimulation } from "./QueueSimulation";
import { SeededRandom } from "./RandomSource";
import { QUEUE_CONFIG } from "./queueConfig";
import type { FlightView } from "./types";

/** Frames fired by hand, 50 ms apart. */
class HandFrames implements FrameScheduler {
  private pending: ((now: number) => void) | null = null;
  private now = performance.now();

  public request(callback: (now: number) => void): number {
    this.pending = callback;
    return 1;
  }

  public cancel(): void {
    this.pending = null;
  }

  public isWaiting(): boolean {
    return this.pending !== null;
  }

  public fire(frames: number): void {
    for (let frame = 0; frame < frames && this.pending !== null; frame += 1) {
      const callback = this.pending;
      this.pending = null;
      this.now += 50;
      callback(this.now);
    }
  }
}

class RecordingPainter implements FramePainter {
  public paints = 0;
  public flown = 0;
  public clears = 0;

  public paint(flights: readonly FlightView[]): void {
    this.paints += 1;
    this.flown = Math.max(this.flown, flights.length);
  }

  public clear(): void {
    this.clears += 1;
  }
}

function loop(): Readonly<{ loop: QueueLoop; frames: HandFrames; painter: RecordingPainter }> {
  const clock = new ManualClock();
  const frames = new HandFrames();
  const painter = new RecordingPainter();
  const simulation = new QueueSimulation(clock, new SeededRandom(1), QUEUE_CONFIG);
  return { loop: new QueueLoop(simulation, clock, frames, painter), frames, painter };
}

describe("QueueLoop", () => {
  it("streams the flow while ambient, painting flights and publishing changed snapshots", () => {
    const { loop: target, frames, painter } = loop();
    let changes = 0;
    target.subscribe(() => (changes += 1));
    const first = target.view();

    target.start("ambient");
    frames.fire(100);
    expect(painter.paints).toBe(100);
    expect(painter.flown).toBeGreaterThan(0);
    expect(changes).toBeGreaterThan(5);
    expect(target.view()).not.toBe(first);
    expect(target.view().totals.produced).toBeGreaterThan(5);

    target.stop();
    expect(frames.isWaiting()).toBe(false);
  });

  it("under reduced motion plays out a send without flights, then stops by itself", () => {
    const { loop: target, frames, painter } = loop();
    target.send(10);
    frames.fire(1000);
    expect(frames.isWaiting()).toBe(false);
    expect(painter.paints).toBe(0);
    expect(target.view().totals).toMatchObject({ produced: 10, processed: 10 });
  });

  it("passes on the events of a frame", () => {
    const { loop: target, frames } = loop();
    const kinds: string[] = [];
    target.listen((events) => kinds.push(...events.map((event) => event.kind)));
    target.start("ambient");
    target.send(10);
    target.send(10);
    target.send(10);
    frames.fire(400);
    expect(kinds).toContain("down");
    expect(kinds).toContain("recovered");
  });

  it("plays the simulation at its playback speed", () => {
    const run = (speed: number): number => {
      const clock = new ManualClock();
      const frames = new HandFrames();
      const simulation = new QueueSimulation(clock, new SeededRandom(1), QUEUE_CONFIG);
      new QueueLoop(simulation, clock, frames, new RecordingPainter(), speed).start("ambient");
      frames.fire(40);
      return clock.now();
    };
    expect(run(0.4) / run(1)).toBeCloseTo(0.4, 2);
  });

  it("refuses a playback speed that is not positive", () => {
    const clock = new ManualClock();
    const simulation = new QueueSimulation(clock, new SeededRandom(1), QUEUE_CONFIG);
    expect(() => new QueueLoop(simulation, clock, new HandFrames(), new RecordingPainter(), 0)).toThrow(RangeError);
  });
});

describe("composeQueueToy", () => {
  it("draws the same lived-in first frame every time, so the server and the browser agree", () => {
    const names = ["Orders", "Payments", "Inventory"];
    const templates = { down: "", restarting: "", recovered: "", settled: "" };
    const first = composeQueueToy(names, templates).loop.view();
    expect(composeQueueToy(names, templates).loop.view()).toEqual(first);
    expect(first.totals.processed).toBeGreaterThan(5);
    expect(first.totals.restarts).toBe(0);
  });

  it("refuses a panel with a different number of services than it is tuned for", () => {
    expect(() =>
      composeQueueToy(["Orders"], { down: "", restarting: "", recovered: "", settled: "" }),
    ).toThrow();
  });
});
