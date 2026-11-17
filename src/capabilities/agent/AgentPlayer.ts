import type { AgentFrame, AgentTimeline } from "./AgentTimeline";

/**
 * Plays the timeline and owns the one interaction, the greeting. Route time only moves while the agent
 * is not waving, so a click stops it where it stands, it waves and says hi, and then carries on. A click
 * mid-hop waits for the landing. Wall time always moves, so it keeps blinking while it waves.
 */
export class AgentPlayer {
  private routeMs: number;
  private clockMs = 0;
  private greetingMs: number | null = null;
  private pending = false;
  private greetings = 0;

  public constructor(
    private timeline: AgentTimeline,
    startMs: number,
    private readonly greeting: string,
    private readonly greetingLengthMs: number,
  ) {
    if (!(greetingLengthMs > 0)) {
      throw new Error(`A greeting must last a while, not ${greetingLengthMs} ms`);
    }
    this.routeMs = startMs;
  }

  /** Moves time on by `ms`. */
  public advance(ms: number): void {
    if (!Number.isFinite(ms) || ms < 0) {
      throw new Error(`Time only moves forward: ${ms}`);
    }
    this.clockMs += ms;
    if (this.greetingMs !== null) {
      this.greetingMs += ms;
      if (this.greetingMs >= this.greetingLengthMs) {
        this.greetingMs = null;
      }
      return;
    }
    if (this.pending && !this.airborne()) {
      this.pending = false;
      this.begin();
      return;
    }
    this.routeMs += ms;
  }

  /** The visitor clicked the agent: it waves now, or once it lands. Clicking again while it waves starts over. */
  public greet(): void {
    if (this.airborne()) {
      this.pending = true;
      return;
    }
    this.begin();
  }

  /** Whether it is waving, or about to. */
  public isGreeting(): boolean {
    return this.greetingMs !== null || this.pending;
  }

  /** Plays on another stage's timeline from the same beat, so the agent keeps its place when the layout changes. */
  public stageOn(timeline: AgentTimeline): void {
    this.routeMs = timeline.timeAt(this.timeline.cursorAt(this.routeMs));
    this.timeline = timeline;
  }

  /** Wall time, in ms, for blinking and pulsing. */
  public clock(): number {
    return this.clockMs;
  }

  /** What to draw now. */
  public frame(): AgentFrame {
    const frame = this.timeline.frameAt(this.routeMs);
    if (this.greetingMs === null) {
      return frame;
    }
    return {
      ...frame,
      action: { kind: "greet", progress: this.greetingMs / this.greetingLengthMs, elapsedMs: this.greetingMs },
      look: { x: 0, y: 0 },
      bubble: { key: `hello:${this.greetings}`, text: this.greeting, result: null, tone: "hello" },
    };
  }

  private begin(): void {
    this.greetingMs = 0;
    this.greetings += 1;
  }

  private airborne(): boolean {
    const action = this.timeline.frameAt(this.routeMs).action;
    return action.kind === "walk" && action.airborne;
  }
}
