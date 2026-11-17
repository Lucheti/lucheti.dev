import type { StageArrangement } from "./StageLayout";
import type { AgentTimings } from "./AgentTimeline";

/**
 * One row for wide panels: the agent walks a lane above six tiles, inbox to ship, and walks the whole
 * way back. The labels sit in the strip under the tiles.
 */
export const WIDE_STAGE: StageArrangement = {
  kind: "wide",
  width: 600,
  height: 200,
  rows: [["inbox", "read", "search", "code", "test", "ship"]],
  lanes: [104],
  tileTops: [116],
  tile: { width: 76, height: 58 },
  walk: { baseMs: 450, perColumnMs: 250 },
  hop: { ms: 850, height: 34 },
};

/**
 * Two rows for phones, read as a loop: inbox, read and search left to right on top, then code, test and
 * ship right to left underneath. The agent hops down from Search to Code and back up from Ship to the inbox.
 */
export const COMPACT_STAGE: StageArrangement = {
  kind: "compact",
  width: 320,
  height: 396,
  rows: [
    ["inbox", "read", "search"],
    ["ship", "test", "code"],
  ],
  // The second lane leaves room for the agent and its bubble under the first row's labels.
  lanes: [104, 312],
  tileTops: [114, 322],
  tile: { width: 84, height: 50 },
  walk: { baseMs: 450, perColumnMs: 250 },
  hop: { ms: 850, height: 30 },
};

/** The panel switches to the wide stage from this inner width, in px. */
export const WIDE_FROM_PX = 420;

/** How long each beat lasts, in ms; a clean ticket takes 14 s on the wide stage. */
export const AGENT_TIMINGS: AgentTimings = {
  pickupMs: 1000,
  workMs: { read: 1500, search: 1500, code: 1800, test: 1600 },
  fixMs: 1500,
  shakeMs: 800,
  shipMs: 1400,
};

/** How long the agent waves when clicked, in ms. */
export const GREETING_MS = 1600;

/** The seed of the retry plan, so every visitor sees the same run. */
export const AGENT_SEED = 1117;
