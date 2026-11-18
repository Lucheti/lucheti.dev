import type { DiffLineCopy, SessionPromptId } from "@/content";

/** How a test run came out, and the words it reports. */
export type TestOutcome = Readonly<{ kind: "pass"; result: string }> | Readonly<{ kind: "fail"; result: string }>;

/** A call the agent makes to one of its tools. */
export type ToolCall =
  | Readonly<{ tool: "read_file"; path: string; result: string }>
  | Readonly<{ tool: "search"; query: string; result: string }>
  | Readonly<{ tool: "edit"; path: string; diff: readonly DiffLineCopy[] }>
  | Readonly<{ tool: "run_tests"; outcome: TestOutcome }>;

/** The tools the agent has. */
export type ToolName = ToolCall["tool"];

/**
 * One row of the session's stream as it stands at a moment. Typed rows say how many of their characters
 * are on screen so far; a tool call says whether it has come back.
 */
export type StreamRow =
  | Readonly<{ kind: "request"; key: string; text: string }>
  | Readonly<{ kind: "plan"; key: string; lines: readonly string[]; typed: number }>
  | Readonly<{ kind: "note"; key: string; text: string; typed: number }>
  | Readonly<{ kind: "tool"; key: string; call: ToolCall; done: boolean }>
  | Readonly<{ kind: "review"; key: string; comment: string; resolved: boolean }>
  | Readonly<{ kind: "pr"; key: string; number: number; title: string; added: number; removed: number }>;

/** A moment in a session worth saying out loud. */
export type SessionCue =
  | Readonly<{ kind: "started"; prompt: SessionPromptId }>
  | Readonly<{ kind: "failed" }>
  | Readonly<{ kind: "passed" }>
  | Readonly<{ kind: "resolved" }>
  | Readonly<{ kind: "opened" }>;

/** A cue and when it falls, in ms from the start of a run. */
export type TimedCue = Readonly<{ at: number; cue: SessionCue }>;

/** Whether the agent is at work. */
export type SessionStatus = "idle" | "running" | "done";

/** Who started a run: the ghost cursor's loop, or the visitor. */
export type RunDriver = "ghost" | "visitor";

/** The session as the window shows it. */
export type SessionView = Readonly<{
  /** The current run's prompt; null before the first run. */
  prompt: SessionPromptId | null;
  /** The current run's number, from 1; rows are keyed by it, so a new run starts a fresh stream. */
  run: number;
  status: SessionStatus;
  rows: readonly StreamRow[];
}>;

/** How many lines an edit adds and removes. */
export type DiffStat = Readonly<{ added: number; removed: number }>;

/** Counts an edit's added and removed lines. */
export function diffStat(diff: readonly DiffLineCopy[]): DiffStat {
  return {
    added: diff.filter((line) => line.sign === "add").length,
    removed: diff.filter((line) => line.sign === "remove").length,
  };
}
