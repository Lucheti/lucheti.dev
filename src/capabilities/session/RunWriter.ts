import type { SessionEditCopy, SessionPromptCopy, SessionPromptId } from "@/content";
import { NoteEntry, PlanEntry, PrEntry, RequestEntry, ReviewEntry, ToolEntry, type PullRequest, type ScriptEntry } from "./entries";
import type { SessionPace } from "./pace";
import { SessionScript } from "./SessionScript";
import type { TestOutcome, ToolCall } from "./stream";

/** Writes the script of a run. */
export interface ScriptSource {
  /** The run for `prompt`; when `failing`, the first test run fails and the agent fixes it. */
  scriptFor(prompt: SessionPromptId, failing: boolean): SessionScript;
}

/** Lays rows end to end on a clock, at the session's pace. */
class ScriptBuilder {
  private clock: number;
  private readonly entries: ScriptEntry[] = [];

  public constructor(private readonly pace: SessionPace) {
    this.clock = pace.leadMs;
  }

  public request(text: string): void {
    this.add(new RequestEntry(this.nextKey(), this.clock, text));
    this.clock += this.pace.afterRequestMs;
  }

  public plan(lines: readonly string[]): void {
    const entry = this.add(new PlanEntry(this.nextKey(), this.clock, lines, this.pace.msPerChar));
    this.clock = entry.end + this.pace.afterTextMs;
  }

  public note(text: string): void {
    const entry = this.add(new NoteEntry(this.nextKey(), this.clock, text, this.pace.msPerChar));
    this.clock = entry.end + this.pace.afterTextMs;
  }

  public read(path: string, result: string): void {
    this.call({ tool: "read_file", path, result }, 0);
  }

  public search(query: string, result: string): void {
    this.call({ tool: "search", query, result }, 0);
  }

  /** An edit; its diff opens as it comes back and holds the eye a moment. */
  public edit(edit: SessionEditCopy): void {
    this.call({ tool: "edit", path: edit.path, diff: edit.diff }, this.pace.diffHoldMs);
  }

  public test(outcome: TestOutcome): void {
    this.call({ tool: "run_tests", outcome }, 0);
  }

  /** The reviewer's comment, the agent's edit that answers it, and the comment resolved once the edit lands. */
  public review(comment: string, fix: SessionEditCopy): void {
    const editAt = this.clock + this.pace.reviewReadMs;
    const editEnd = editAt + this.pace.runMs.edit;
    const resolveAt = editEnd + this.pace.diffHoldMs;
    this.add(new ReviewEntry(this.nextKey(), this.clock, comment, resolveAt));
    this.add(new ToolEntry(this.nextKey(), editAt, { tool: "edit", path: fix.path, diff: fix.diff }, this.pace.runMs.edit));
    this.clock = resolveAt + this.pace.beforePrMs;
  }

  public pr(pr: PullRequest): void {
    this.add(new PrEntry(this.nextKey(), this.clock, pr));
  }

  public build(): SessionScript {
    return new SessionScript(this.entries);
  }

  private call(call: ToolCall, holdMs: number): void {
    const entry = this.add(new ToolEntry(this.nextKey(), this.clock, call, this.pace.runMs[call.tool]));
    this.clock = entry.end + holdMs + this.pace.afterToolMs;
  }

  private add<E extends ScriptEntry>(entry: E): E {
    this.entries.push(entry);
    return entry;
  }

  private nextKey(): string {
    return `row-${this.entries.length}`;
  }
}

/**
 * Writes each prompt's run from its copy: the request, the plan, a read, a search and an edit, the tests
 * (failing first and fixed, on a failing run), the review answered and resolved, and the pull request.
 */
export class RunWriter implements ScriptSource {
  public constructor(
    private readonly runs: Readonly<Record<SessionPromptId, SessionPromptCopy>>,
    private readonly pace: SessionPace,
  ) {}

  public scriptFor(prompt: SessionPromptId, failing: boolean): SessionScript {
    const copy = this.runs[prompt];
    const script = new ScriptBuilder(this.pace);
    script.request(copy.request);
    script.plan(copy.plan);
    script.read(copy.read.path, copy.read.result);
    script.search(copy.search.query, copy.search.result);
    script.edit(copy.edit);
    if (failing) {
      script.test({ kind: "fail", result: copy.failure.result });
      script.note(copy.failure.note);
      script.edit(copy.failure.fix);
    }
    script.test({ kind: "pass", result: copy.passed });
    script.review(copy.review.comment, copy.review.fix);
    script.pr(copy.pr);
    return script.build();
  }
}
