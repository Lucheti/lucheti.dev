import type { AgentPlayer } from "./AgentPlayer";
import type { AgentFrame, AgentTimeline } from "./AgentTimeline";
import type { StageKind } from "./StageLayout";

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

/** What React draws: the frame, the wall clock for the pose, and which stage it is laid out on. */
export type AgentView = Readonly<{ frame: AgentFrame; clockMs: number; stage: StageKind }>;

/**
 * How the loop runs: `playing` walks the route while the panel is on screen; `greeting` (reduced motion,
 * or off screen) only runs until a wave is over.
 */
type LoopMode = "playing" | "greeting";

/** A frame is never counted as longer than this, so a stalled tab does not fast-forward the agent. */
const MAX_FRAME_MS = 100;

/**
 * Drives the player on animation frames and is the panel's store: React reads `view()` through
 * `useSyncExternalStore`. It only asks for frames while playing or waving.
 */
export class AgentLoop {
  private current: AgentView;
  private stage: StageKind;
  private mode: LoopMode | null = null;
  private handle = 0;
  private last = 0;
  private readonly listeners = new Set<() => void>();

  public constructor(
    private readonly player: AgentPlayer,
    private readonly frames: FrameScheduler,
    private readonly timelines: Readonly<Record<StageKind, AgentTimeline>>,
    stage: StageKind,
  ) {
    this.stage = stage;
    this.current = this.capture();
  }

  /** The latest view. */
  public readonly view = (): AgentView => this.current;

  /** Calls `listener` whenever `view()` changes; returns the unsubscribe. */
  public readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** Starts walking the route. */
  public play(): void {
    this.run("playing");
  }

  /** Stops walking; a wave in progress still finishes. */
  public pause(): void {
    if (this.mode === "playing") {
      this.mode = this.player.isGreeting() ? "greeting" : null;
      if (this.mode === null) {
        this.frames.cancel(this.handle);
      }
    }
  }

  /** Stops everything, for when the panel goes away. */
  public dispose(): void {
    if (this.mode !== null) {
      this.frames.cancel(this.handle);
      this.mode = null;
    }
  }

  /** The visitor clicked the agent. */
  public greet(): void {
    this.player.greet();
    this.publish();
    if (this.mode === null) {
      this.run("greeting");
    }
  }

  /** Lays the agent out on another stage, keeping its place in the route. */
  public showStage(stage: StageKind): void {
    if (stage === this.stage) {
      return;
    }
    this.stage = stage;
    this.player.stageOn(this.timelines[stage]);
    this.publish();
  }

  private run(mode: LoopMode): void {
    const idle = this.mode === null;
    this.mode = mode;
    if (idle) {
      this.last = performance.now();
      this.handle = this.frames.request(this.tick);
    }
  }

  private readonly tick = (now: number): void => {
    this.player.advance(Math.min(MAX_FRAME_MS, Math.max(0, now - this.last)));
    this.last = now;
    this.publish();
    if (this.mode === "greeting" && !this.player.isGreeting()) {
      this.mode = null;
      return;
    }
    if (this.mode !== null) {
      this.handle = this.frames.request(this.tick);
    }
  };

  private publish(): void {
    this.current = this.capture();
    this.listeners.forEach((listener) => listener());
  }

  private capture(): AgentView {
    return { frame: this.player.frame(), clockMs: this.player.clock(), stage: this.stage };
  }
}
