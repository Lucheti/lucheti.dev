import type { ToolName } from "./stream";

/** How a run is paced, in ms: calm enough to read, quick enough to feel like work. */
export type SessionPace = Readonly<{
  /** Before the visitor's message appears. */
  leadMs: number;
  /** After the message, before the agent starts typing. */
  afterRequestMs: number;
  /** The agent's typing speed. */
  msPerChar: number;
  /** After the agent finishes a line of text. */
  afterTextMs: number;
  /** How long each tool runs before its result comes back. */
  runMs: Readonly<Record<ToolName, number>>;
  /** After a tool call comes back, before the next row. */
  afterToolMs: number;
  /** How long an edit's diff holds the eye before the next row. */
  diffHoldMs: number;
  /** How long the reviewer's comment sits before the agent answers it. */
  reviewReadMs: number;
  /** After the review is resolved, before the pull request's card. */
  beforePrMs: number;
}>;

/** The pace every visitor sees. */
export function sessionPace(): SessionPace {
  return {
    leadMs: 350,
    afterRequestMs: 800,
    msPerChar: 20,
    afterTextMs: 500,
    runMs: { read_file: 850, search: 1000, edit: 1100, run_tests: 2000 },
    afterToolMs: 420,
    diffHoldMs: 1000,
    reviewReadMs: 1500,
    beforePrMs: 700,
  };
}
