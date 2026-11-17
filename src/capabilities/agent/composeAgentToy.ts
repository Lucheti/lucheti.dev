import type { AgentPanel } from "@/content";
import {
  AGENT_SEED,
  AGENT_TIMINGS,
  COMPACT_STAGE,
  GREETING_MS,
  WIDE_STAGE,
} from "./agentConfig";
import { AgentLoop, BrowserFrames, type FrameScheduler } from "./AgentLoop";
import { AgentPlayer } from "./AgentPlayer";
import { AgentPoser } from "./AgentPose";
import { AgentTimeline } from "./AgentTimeline";
import { RetryPlan } from "./RetryPlan";
import { StageLayout, type StageKind } from "./StageLayout";

/** Everything the agent panel runs on. */
export type AgentToy = Readonly<{
  loop: AgentLoop;
  layouts: Readonly<Record<StageKind, StageLayout>>;
  posers: Readonly<{ live: AgentPoser; still: AgentPoser }>;
}>;

/**
 * The panel's composition root: lays out both stages, plots a timeline on each, and starts the agent
 * at Code, part way through its first edit: the frame drawn before it plays, and the still frame for
 * reduced motion.
 */
export function composeAgentToy(panel: AgentPanel, frames: FrameScheduler = new BrowserFrames()): AgentToy {
  const layouts = { wide: new StageLayout(WIDE_STAGE), compact: new StageLayout(COMPACT_STAGE) };
  const plan = new RetryPlan(AGENT_SEED);
  const timelines = {
    wide: new AgentTimeline(layouts.wide, panel.tickets, plan, AGENT_TIMINGS),
    compact: new AgentTimeline(layouts.compact, panel.tickets, plan, AGENT_TIMINGS),
  };
  const start = timelines.wide.momentAt("code", 0.5);
  const player = new AgentPlayer(timelines.wide, start, panel.greeting, GREETING_MS);
  return {
    loop: new AgentLoop(player, frames, timelines, "wide"),
    layouts,
    posers: { live: new AgentPoser(false), still: new AgentPoser(true) },
  };
}
