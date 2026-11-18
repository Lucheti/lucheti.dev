import type { SessionCopy, SessionPromptId } from "@/content";
import { BrowserFrames, DomGhostSurface, FrameLoop, GhostDirector, GhostPresence, GhostScript } from "@/laptop";
import { SeededRandom } from "../agent/SeededRandom";
import { AgentSession } from "./AgentSession";
import { sessionPace } from "./pace";
import { RunWriter } from "./RunWriter";
import { SeededFailures } from "./SeededFailures";
import { SessionAnnouncer } from "./SessionAnnouncer";
import { PatientGhost, SessionHands, SessionMarks, sessionGhostLoop, type SessionEffect, type SessionTarget } from "./sessionGhost";
import { SessionRunner } from "./SessionRunner";

/** The runs every visitor sees: the opening run fails and is fixed, the ghost's first passes and its second fails. */
const SEED = 20_261_238;
/** About one run in three fails its first test run. */
const FAIL_RATE = 1 / 3;
/** The ghost comes back this long after the visitor's pointer leaves, as on the other panels. */
const RESUME_MS = 4_000;
/** How long a finished run rests on its pull request before the ghost moves on. */
const REST_MS = 4_500;
/** How long the visitor's own finished run stays before the ghost may come back. */
const VISITOR_GRACE_MS = 6_000;

/** Everything the agent session panel runs on. */
export type AgentSessionParts = Readonly<{
  runner: SessionRunner;
  director: GhostDirector<SessionTarget, SessionEffect>;
  surface: DomGhostSurface<SessionTarget>;
  announcer: SessionAnnouncer;
  /** The frames: the ghost and the streaming run. Under reduced motion they never start. */
  loop: FrameLoop;
}>;

/**
 * The agent session panel's composition root: the session, opened on a finished run of the first prompt,
 * its store and live-region words, and the ghost that clicks the other prompts in turn.
 */
export function composeAgentSession(copy: SessionCopy): AgentSessionParts {
  const [opening, ...others] = copy.order;
  if (opening === undefined) {
    throw new Error("The session needs at least one prompt");
  }
  const writer = new RunWriter(copy.runs, sessionPace());
  const session = new AgentSession(writer, new SeededFailures(new SeededRandom(SEED), FAIL_RATE));
  session.show(opening, "ghost");
  // The opening run is the page's first picture, not news: nothing to announce.
  session.takeCues();
  const runner = new SessionRunner(session);
  const ghostOrder: readonly SessionPromptId[] = [...others, opening];
  const longestRun = Math.max(...copy.order.map((prompt) => writer.scriptFor(prompt, true).duration()));
  const surface = new DomGhostSurface<SessionTarget>(new SessionMarks());
  const director = new GhostDirector<SessionTarget, SessionEffect>(
    new GhostScript(sessionGhostLoop(ghostOrder, longestRun + REST_MS)),
    new GhostPresence(RESUME_MS),
    new SessionHands(runner),
    surface,
  );
  return {
    runner,
    director,
    surface,
    announcer: new SessionAnnouncer(copy),
    loop: new FrameLoop(new BrowserFrames(), [new PatientGhost(director, session, VISITOR_GRACE_MS), runner]),
  };
}
