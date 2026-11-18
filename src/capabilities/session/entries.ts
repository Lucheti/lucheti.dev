import { assertNever } from "@/laptop";
import type { SessionCue, StreamRow, TestOutcome, TimedCue, ToolCall } from "./stream";

/**
 * One row of a run's script, laid out in time: when it appears, when it stops changing, what it looks like
 * at any moment after that, and the cues it sets off. Times are in ms from the start of the run.
 */
export interface ScriptEntry {
  /** When the row appears. */
  readonly at: number;
  /** When it has stopped changing. */
  readonly end: number;
  /** The row at `time`, which is at or after `at`. */
  rowAt(time: number): StreamRow;
  /** A number that changes whenever the row's look does, so a caller can tell when to redraw. */
  stageAt(time: number): number;
  /** The moments this row announces. */
  cues(): readonly TimedCue[];
}

function checkTime(ms: number, what: string): void {
  if (!(ms >= 0) || !Number.isFinite(ms)) {
    throw new Error(`${what} must be zero or more ms: ${ms}`);
  }
}

/** Text that types itself out, one character every `msPerChar`, from `at`. */
export class Typing {
  public readonly end: number;

  public constructor(
    private readonly at: number,
    private readonly length: number,
    private readonly msPerChar: number,
  ) {
    checkTime(at, "Typing's start");
    if (!(msPerChar > 0) || !Number.isFinite(msPerChar)) {
      throw new Error(`Typing needs some time per character: ${msPerChar}`);
    }
    this.end = at + length * msPerChar;
  }

  /** How many characters are on screen at `time`. */
  public typedAt(time: number): number {
    return Math.min(this.length, Math.max(0, Math.floor((time - this.at) / this.msPerChar)));
  }
}

/** The visitor's message: it appears whole. */
export class RequestEntry implements ScriptEntry {
  public readonly end: number;

  public constructor(
    private readonly key: string,
    public readonly at: number,
    private readonly text: string,
  ) {
    checkTime(at, "A request's time");
    this.end = at;
  }

  public rowAt(): StreamRow {
    return { kind: "request", key: this.key, text: this.text };
  }

  public stageAt(): number {
    return 0;
  }

  public cues(): readonly TimedCue[] {
    return [];
  }
}

/** The agent's plan, a few lines it types out in turn. */
export class PlanEntry implements ScriptEntry {
  public readonly end: number;
  private readonly typing: Typing;

  public constructor(
    private readonly key: string,
    public readonly at: number,
    private readonly lines: readonly string[],
    msPerChar: number,
  ) {
    if (lines.length === 0) {
      throw new Error("A plan needs at least one line");
    }
    this.typing = new Typing(at, lines.reduce((sum, line) => sum + line.length, 0), msPerChar);
    this.end = this.typing.end;
  }

  public rowAt(time: number): StreamRow {
    return { kind: "plan", key: this.key, lines: this.lines, typed: this.typing.typedAt(time) };
  }

  public stageAt(time: number): number {
    return this.typing.typedAt(time);
  }

  public cues(): readonly TimedCue[] {
    return [];
  }
}

/** A line the agent types out between its calls. */
export class NoteEntry implements ScriptEntry {
  public readonly end: number;
  private readonly typing: Typing;

  public constructor(
    private readonly key: string,
    public readonly at: number,
    private readonly text: string,
    msPerChar: number,
  ) {
    this.typing = new Typing(at, text.length, msPerChar);
    this.end = this.typing.end;
  }

  public rowAt(time: number): StreamRow {
    return { kind: "note", key: this.key, text: this.text, typed: this.typing.typedAt(time) };
  }

  public stageAt(time: number): number {
    return this.typing.typedAt(time);
  }

  public cues(): readonly TimedCue[] {
    return [];
  }
}

/** What a finished test run says. */
function testCue(outcome: TestOutcome): SessionCue {
  switch (outcome.kind) {
    case "pass":
      return { kind: "passed" };
    case "fail":
      return { kind: "failed" };
    default:
      return assertNever(outcome);
  }
}

/** A tool call: it runs for `runMs`, then shows its result. A test run announces how it came out. */
export class ToolEntry implements ScriptEntry {
  public readonly end: number;

  public constructor(
    private readonly key: string,
    public readonly at: number,
    private readonly call: ToolCall,
    runMs: number,
  ) {
    checkTime(at, "A tool call's time");
    if (!(runMs > 0) || !Number.isFinite(runMs)) {
      throw new Error(`A tool call takes some time: ${runMs}`);
    }
    this.end = at + runMs;
  }

  public rowAt(time: number): StreamRow {
    return { kind: "tool", key: this.key, call: this.call, done: time >= this.end };
  }

  public stageAt(time: number): number {
    return time >= this.end ? 1 : 0;
  }

  public cues(): readonly TimedCue[] {
    switch (this.call.tool) {
      case "run_tests":
        return [{ at: this.end, cue: testCue(this.call.outcome) }];
      case "read_file":
      case "search":
      case "edit":
        return [];
      default:
        return assertNever(this.call);
    }
  }
}

/** The reviewer's comment: open until the agent's answer lands at `resolveAt`. */
export class ReviewEntry implements ScriptEntry {
  public readonly end: number;

  public constructor(
    private readonly key: string,
    public readonly at: number,
    private readonly comment: string,
    resolveAt: number,
  ) {
    checkTime(at, "A review's time");
    if (!(resolveAt > at)) {
      throw new Error(`A review is resolved after it is left: ${at} then ${resolveAt}`);
    }
    this.end = resolveAt;
  }

  public rowAt(time: number): StreamRow {
    return { kind: "review", key: this.key, comment: this.comment, resolved: time >= this.end };
  }

  public stageAt(time: number): number {
    return time >= this.end ? 1 : 0;
  }

  public cues(): readonly TimedCue[] {
    return [{ at: this.end, cue: { kind: "resolved" } }];
  }
}

/** The pull request the run ends with. */
export type PullRequest = Readonly<{ number: number; title: string; added: number; removed: number }>;

/** The ending: the pull request's card. */
export class PrEntry implements ScriptEntry {
  public readonly end: number;

  public constructor(
    private readonly key: string,
    public readonly at: number,
    private readonly pr: PullRequest,
  ) {
    checkTime(at, "A pull request's time");
    this.end = at;
  }

  public rowAt(): StreamRow {
    return { kind: "pr", key: this.key, ...this.pr };
  }

  public stageAt(): number {
    return 0;
  }

  public cues(): readonly TimedCue[] {
    return [{ at: this.at, cue: { kind: "opened" } }];
  }
}
