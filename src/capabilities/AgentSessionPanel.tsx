"use client";

import { useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { SessionCopy } from "@/content";
import { AppStage } from "@/laptop";
import { AgentWindow } from "./session/AgentWindow";
import { composeAgentSession } from "./session/composeAgentSession";

/** Where the ghost rests between runs: in the empty left of the chip row, clear of the stream it watches. */
const REST = { x: 118, y: 70 } as const;

/**
 * The AI chapter's panel: an agent app's window on its own, its top-right corner in view, open on a coding
 * session. A prompt chip starts a run that streams in: the request, a short plan, tool calls with a small
 * diff, the tests (now and then failing first and fixed), a review answered and a pull request opened.
 * While nobody is touching it, a ghost cursor clicks the chips in turn and watches each run. Under reduced
 * motion there is no ghost and no streaming; a chip shows its run finished at once.
 */
export function AgentSessionPanel({ session }: Readonly<{ session: SessionCopy }>): ReactNode {
  const [parts] = useState(() => composeAgentSession(session));
  const boxRef = useRef<HTMLDivElement>(null);
  const onScreen = useInView(boxRef, { margin: "0px 0px -10% 0px" });
  const reduced = useReducedMotion() === true;
  const [message, setMessage] = useState("");
  const { loop, runner, announcer, director, surface } = parts;

  useEffect(() => {
    if (onScreen && !reduced) {
      loop.start();
    } else {
      loop.stop();
    }
  }, [onScreen, reduced, loop]);

  useEffect(() => () => loop.stop(), [loop]);

  useEffect(() => runner.listen((cues) => setMessage(cues.map((cue) => announcer.say(cue)).join(" "))), [runner, announcer]);

  return (
    <AppStage corner={{ kind: "top-right" }} label={session.label} boxRef={boxRef} ghost={director} screen={surface} rest={REST}>
      <AgentWindow copy={session} parts={parts} reduced={reduced} message={message} />
    </AppStage>
  );
}
