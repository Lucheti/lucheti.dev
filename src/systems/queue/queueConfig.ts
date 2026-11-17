import type { QueueConfig } from "./types";

/**
 * The tuning the panel runs with, found by sweeping seeds and click patterns:
 * - the steady flow (about 1.5 messages a second) keeps the services near a fifth of what they can do,
 *   so it never trips anything by itself;
 * - one "send" makes them busy for a moment and nothing more;
 * - two quick sends usually take the slowest down (sometimes two), and three or more usually take
 *   down two or all three; everything is drained and back to normal 9–15 s later.
 * The broker deals at most about 11 messages a second, so a flood visibly stacks up in the queue first.
 */
export const QUEUE_CONFIG: QueueConfig = {
  arrival: { meanGapMs: 667, jitter: 0.4 },
  burst: { gapMs: 45, maxOutstanding: 60 },
  travel: { toQueue: 520, toService: 420, back: 380 },
  broker: { dwellMs: 260, dealGapMs: 90, capacity: 5 },
  rules: { workers: 2, workJitter: 0.25, limit: 3, overloadMs: 1500, downMs: 2500, restartMs: 1300 },
  services: [{ workMs: 550 }, { workMs: 750 }, { workMs: 1000 }],
  stepMs: 10,
};
