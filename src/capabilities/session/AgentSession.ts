import type { SessionPromptId } from "@/content";
import type { ScriptSource } from "./RunWriter";
import type { FailureDraw } from "./SeededFailures";
import { SessionRun } from "./SessionRun";
import type { RunDriver, SessionCue, SessionView } from "./stream";

const IDLE: SessionView = { prompt: null, run: 0, status: "idle", rows: [] };

/**
 * The agent's session: the current run, the rows it shows and how many runs there have been. Starting a run
 * clears the stream; each run's first test run fails or not by a seeded draw. The view is a new object only
 * when something on screen changed, so a renderer can compare it by identity.
 */
export class AgentSession {
  private run: SessionRun | null = null;
  private runs = 0;
  private pending: SessionCue[] = [];
  private shown: SessionView = IDLE;
  private shownKey = "";

  public constructor(
    private readonly scripts: ScriptSource,
    private readonly failures: FailureDraw,
  ) {}

  /** Starts a run of `prompt`, by the ghost or the visitor; whatever ran before is cleared. */
  public start(prompt: SessionPromptId, driver: RunDriver): void {
    this.runs += 1;
    this.run = new SessionRun(prompt, this.runs, driver, this.scripts.scriptFor(prompt, this.failures.next()));
    this.pending.push({ kind: "started", prompt });
    this.refresh();
  }

  /** Starts a run of `prompt` and shows it finished at once: the opening run, or any run under reduced motion. */
  public show(prompt: SessionPromptId, driver: RunDriver): void {
    this.start(prompt, driver);
    this.pending.push(...(this.run?.finish() ?? []));
    this.refresh();
  }

  /** Lets `ms` pass in the current run. */
  public advance(ms: number): void {
    if (this.run !== null) {
      this.pending.push(...this.run.advance(ms));
      this.refresh();
    }
  }

  public view(): SessionView {
    return this.shown;
  }

  /** How many runs have started. */
  public runCount(): number {
    return this.runs;
  }

  /** Whether the visitor's own run is on screen: still running, or finished less than `graceMs` ago. */
  public visitorWatching(graceMs: number): boolean {
    return this.run !== null && this.run.driver === "visitor" && this.run.doneFor() < graceMs;
  }

  /** The cues since the last call, in order. */
  public takeCues(): readonly SessionCue[] {
    const cues = this.pending;
    this.pending = [];
    return cues;
  }

  private refresh(): void {
    const run = this.run;
    if (run === null) {
      return;
    }
    const key = run.stageKey();
    if (key !== this.shownKey) {
      this.shownKey = key;
      this.shown = { prompt: run.prompt, run: run.id, status: run.status(), rows: run.rows() };
    }
  }
}
