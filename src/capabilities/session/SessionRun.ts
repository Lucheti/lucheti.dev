import type { SessionPromptId } from "@/content";
import type { SessionScript } from "./SessionScript";
import type { RunDriver, SessionCue, SessionStatus, StreamRow } from "./stream";

/** One run in progress: its script and how far into it the session is. Time keeps counting after it ends. */
export class SessionRun {
  private elapsed = 0;

  public constructor(
    public readonly prompt: SessionPromptId,
    /** The run's number in the session, from 1. */
    public readonly id: number,
    public readonly driver: RunDriver,
    private readonly script: SessionScript,
  ) {}

  /** Lets `ms` pass; returns the cues that fell in it. */
  public advance(ms: number): readonly SessionCue[] {
    if (!(ms >= 0) || !Number.isFinite(ms)) {
      throw new Error(`Time only moves forward: ${ms}`);
    }
    const before = this.elapsed;
    this.elapsed += ms;
    return this.script.cuesBetween(before, this.elapsed);
  }

  /** Jumps to the end of the run; returns the cues it skipped over. */
  public finish(): readonly SessionCue[] {
    return this.advance(Math.max(0, this.script.duration() - this.elapsed));
  }

  public status(): SessionStatus {
    return this.script.runningAt(this.elapsed) ? "running" : "done";
  }

  /** How long the run has been finished; 0 while it runs. */
  public doneFor(): number {
    return Math.max(0, this.elapsed - this.script.duration());
  }

  public rows(): readonly StreamRow[] {
    return this.script.rowsAt(this.elapsed);
  }

  /** A key that changes whenever the run's look does. */
  public stageKey(): string {
    return `${this.id}:${this.status()}:${this.script.stageKeyAt(this.elapsed)}`;
  }
}
