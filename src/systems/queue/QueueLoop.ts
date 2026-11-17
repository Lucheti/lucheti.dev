import { assertNever } from "./assertNever";
import type { ManualClock } from "./Clock";
import type { FramePainter } from "./FlightPainter";
import type { QueueSimulation } from "./QueueSimulation";
import type { QueueEvent, QueueSnapshot } from "./types";

/** Schedules a callback for the next frame. */
export interface FrameScheduler {
  request(callback: (now: number) => void): number;
  cancel(handle: number): void;
}

/** The browser's animation frames. */
export class BrowserFrames implements FrameScheduler {
  /** Asks for the next animation frame. */
  public request(callback: (now: number) => void): number {
    return requestAnimationFrame(callback);
  }

  /** Cancels a requested frame. */
  public cancel(handle: number): void {
    cancelAnimationFrame(handle);
  }
}

/**
 * How the loop runs: `ambient` streams the steady flow and draws the flights until stopped;
 * `until-settled` (reduced motion) plays out what the visitor sent without drawing flights, then stops.
 */
export type LoopMode = "ambient" | "until-settled";

/** A frame is never counted as longer than this, so a stalled tab does not fast-forward the toy. */
const MAX_FRAME_MS = 100;

type Listener = () => void;
type EventListener = (events: readonly QueueEvent[]) => void;

/**
 * Drives the simulation on animation frames and is the panel's store: React reads `view()` through
 * `useSyncExternalStore` and re-renders only when the snapshot's revision changes; the flights are
 * painted every frame without React.
 */
export class QueueLoop {
  private current: QueueSnapshot;
  private mode: LoopMode | null = null;
  private handle = 0;
  private last = 0;
  private readonly listeners = new Set<Listener>();
  private readonly eventListeners = new Set<EventListener>();

  /**
   * `speed` is the playback rate: simulation time advances `speed` times as fast as real time, so the
   * whole toy can be slowed for reading without retuning the simulation.
   */
  public constructor(
    private readonly simulation: QueueSimulation,
    private readonly clock: ManualClock,
    private readonly frames: FrameScheduler,
    private readonly painter: FramePainter,
    private readonly speed = 1,
  ) {
    if (!(speed > 0 && Number.isFinite(speed))) {
      throw new RangeError(`Playback speed must be a positive number, not ${speed}`);
    }
    this.current = simulation.snapshot();
  }

  /** The latest snapshot that changed something other than flight progress. */
  public readonly view = (): QueueSnapshot => this.current;

  /** Calls `listener` whenever `view()` changes; returns the unsubscribe. */
  public readonly subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** Calls `listener` with the events of each frame that has some; returns the unsubscribe. */
  public listen(listener: EventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  /** Starts (or switches) the loop. */
  public start(mode: LoopMode): void {
    switch (mode) {
      case "ambient":
        this.simulation.resumeSteadyFlow();
        break;
      case "until-settled":
        this.simulation.holdSteadyFlow();
        this.painter.clear();
        break;
      default:
        assertNever(mode);
    }
    const wasRunning = this.mode !== null;
    this.mode = mode;
    if (!wasRunning) {
      this.last = performance.now();
      this.handle = this.frames.request(this.tick);
    }
  }

  /** Stops the loop and hides the flights; the simulation keeps its state. */
  public stop(): void {
    if (this.mode !== null) {
      this.frames.cancel(this.handle);
      this.mode = null;
    }
    this.painter.clear();
  }

  /** The visitor sends `count` messages; with no loop running, it plays them out and stops. */
  public send(count: number): void {
    this.simulation.send(count);
    if (this.mode === null) {
      this.start("until-settled");
    }
  }

  private readonly tick = (now: number): void => {
    this.clock.advance(Math.min(MAX_FRAME_MS, Math.max(0, now - this.last)) * this.speed);
    this.last = now;
    this.simulation.update();
    const snapshot = this.simulation.snapshot();
    if (this.mode === "ambient") {
      this.painter.paint(snapshot.flights);
    }
    if (snapshot.revision !== this.current.revision) {
      this.current = snapshot;
      this.listeners.forEach((listener) => listener());
    }
    const events = this.simulation.takeEvents();
    if (events.length > 0) {
      this.eventListeners.forEach((listener) => listener(events));
    }
    if (this.mode === "until-settled" && this.simulation.isSettled()) {
      this.mode = null;
      return;
    }
    this.handle = this.frames.request(this.tick);
  };
}
