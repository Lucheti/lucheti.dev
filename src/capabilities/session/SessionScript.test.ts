import { describe, expect, it } from "vitest";
import { SITE } from "@/content";
import { RequestEntry, ToolEntry, Typing } from "./entries";
import { sessionPace } from "./pace";
import { RunWriter } from "./RunWriter";
import { SessionScript } from "./SessionScript";
import { diffStat, type StreamRow } from "./stream";

const copy = SITE.ai.session;
const writer = new RunWriter(copy.runs, sessionPace());

/** A row's short name: its kind, and for a tool call its tool and how it came out. */
function nameOf(row: StreamRow): string {
  if (row.kind !== "tool") {
    return row.kind;
  }
  return row.call.tool === "run_tests" ? `run_tests:${row.call.outcome.kind}` : row.call.tool;
}

describe("a run's script", () => {
  it("goes from the request through a read, a search, an edit and the tests to a review and a pull request", () => {
    const script = writer.scriptFor("dark-mode", false);
    expect(script.rowsAt(script.duration()).map(nameOf)).toEqual([
      "request",
      "plan",
      "read_file",
      "search",
      "edit",
      "run_tests:pass",
      "review",
      "edit",
      "pr",
    ]);
  });

  it("fails its first test run on a failing run, then notes the problem, fixes it and passes", () => {
    const script = writer.scriptFor("tests", true);
    expect(script.rowsAt(script.duration()).map(nameOf)).toEqual([
      "request",
      "plan",
      "read_file",
      "search",
      "edit",
      "run_tests:fail",
      "note",
      "edit",
      "run_tests:pass",
      "review",
      "edit",
      "pr",
    ]);
  });

  it("takes longer when a test fails first", () => {
    for (const prompt of copy.order) {
      expect(writer.scriptFor(prompt, true).duration()).toBeGreaterThan(writer.scriptFor(prompt, false).duration() + 3000);
    }
  });

  it("is calm: a run takes between fifteen and thirty seconds", () => {
    for (const prompt of copy.order) {
      for (const failing of [false, true]) {
        const duration = writer.scriptFor(prompt, failing).duration();
        expect(duration).toBeGreaterThan(15_000);
        expect(duration).toBeLessThan(30_000);
      }
    }
  });

  it("shows nothing before the request, and the request alone just after it", () => {
    const script = writer.scriptFor("slow-page", false);
    expect(script.rowsAt(0)).toEqual([]);
    expect(script.rowsAt(sessionPace().leadMs).map(nameOf)).toEqual(["request"]);
  });

  it("types the plan out a character at a time", () => {
    const pace = sessionPace();
    const script = writer.scriptFor("slow-page", false);
    const planAt = pace.leadMs + pace.afterRequestMs;
    const plan = (time: number): StreamRow | undefined => script.rowsAt(time).find((row) => row.kind === "plan");
    expect(plan(planAt)).toMatchObject({ typed: 0 });
    expect(plan(planAt + 10 * pace.msPerChar)).toMatchObject({ typed: 10 });
    const total = copy.runs["slow-page"].plan.join("").length;
    expect(plan(script.duration())).toMatchObject({ typed: total });
  });

  it("runs a tool call before its result comes back", () => {
    const script = writer.scriptFor("dark-mode", false);
    const rows = script.rowsAt(script.duration());
    const readIndex = rows.findIndex((row) => nameOf(row) === "read_file");
    const firstRead = (time: number): StreamRow | undefined => script.rowsAt(time)[readIndex];
    const readAt = [...Array(script.duration()).keys()].find((time) => firstRead(time) !== undefined) ?? 0;
    expect(firstRead(readAt)).toMatchObject({ done: false });
    expect(firstRead(readAt + sessionPace().runMs.read_file)).toMatchObject({ done: true });
  });

  it("announces a failing test run, the passing one, the review resolved and the pull request, in order", () => {
    const script = writer.scriptFor("dark-mode", true);
    expect(script.cuesBetween(0, script.duration()).map((cue) => cue.kind)).toEqual(["failed", "passed", "resolved", "opened"]);
  });

  it("resolves the review only once the agent's edit has come back", () => {
    const script = writer.scriptFor("tests", false);
    const resolvedAt = [...Array(script.duration() + 1).keys()].find((time) => script.cuesBetween(time - 1, time).some((cue) => cue.kind === "resolved")) ?? 0;
    const rows = script.rowsAt(resolvedAt - 1);
    const answer = rows[rows.length - 1];
    expect(answer).toMatchObject({ kind: "tool", done: true });
    expect(rows.find((row) => row.kind === "review")).toMatchObject({ resolved: false });
    expect(script.rowsAt(resolvedAt).find((row) => row.kind === "review")).toMatchObject({ resolved: true });
  });

  it("ends on the pull request, and is running until then", () => {
    const script = writer.scriptFor("slow-page", true);
    const end = script.duration();
    expect(script.runningAt(end - 1)).toBe(true);
    expect(script.runningAt(end)).toBe(false);
    const last = script.rowsAt(end).at(-1);
    expect(last).toMatchObject({ kind: "pr", number: 131, title: copy.runs["slow-page"].pr.title });
  });

  it("changes its stage key only when the stream's look changes", () => {
    const script = writer.scriptFor("dark-mode", false);
    const pace = sessionPace();
    const planAt = pace.leadMs + pace.afterRequestMs;
    expect(script.stageKeyAt(planAt + 1)).toBe(script.stageKeyAt(planAt + pace.msPerChar - 1));
    expect(script.stageKeyAt(planAt + pace.msPerChar)).not.toBe(script.stageKeyAt(planAt));
  });

  it("keys every row uniquely", () => {
    const script = writer.scriptFor("tests", true);
    const keys = script.rowsAt(script.duration()).map((row) => row.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("refuses rows out of order, and an empty run", () => {
    expect(() => new SessionScript([])).toThrow();
    expect(() => new SessionScript([new RequestEntry("b", 500, "late"), new RequestEntry("a", 100, "early")])).toThrow();
  });
});

describe("the script's rows", () => {
  it("types no further than the text", () => {
    const typing = new Typing(100, 5, 20);
    expect(typing.typedAt(50)).toBe(0);
    expect(typing.typedAt(160)).toBe(3);
    expect(typing.typedAt(10_000)).toBe(5);
    expect(typing.end).toBe(200);
  });

  it("refuses a tool call that takes no time", () => {
    expect(() => new ToolEntry("x", 0, { tool: "search", query: "q", result: "1 match" }, 0)).toThrow();
  });
});

describe("diffStat", () => {
  it("counts the added and removed lines", () => {
    expect(diffStat(copy.runs["dark-mode"].edit.diff)).toEqual({ added: 2, removed: 2 });
    expect(diffStat(copy.runs.tests.edit.diff)).toEqual({ added: 3, removed: 0 });
  });
});
