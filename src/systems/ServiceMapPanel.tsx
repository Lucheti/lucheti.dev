"use client";

import { useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ServiceMapCopy } from "@/content";
import { AppStage } from "@/laptop";
import { composeServiceMap } from "./servicemap/composeServiceMap";
import { OpsWindow } from "./servicemap/OpsWindow";

/** Where the ghost rests between moves: low on the canvas under the stores, clear of the cards and the legend. */
const REST = { x: 571, y: 325 } as const;

/**
 * The Back end chapter's panel: an ops app's window on its own, its top-right corner in view, open on a live
 * service map. Requests flow from the clients through the gateway to the services and their
 * stores; clicking a service takes it down and the gateway's circuit breaker opens, tests it half-open and
 * closes once it is back; "Simulate spike" fills the queue and lifts p95 until both settle. While nobody is
 * touching it, a ghost cursor runs that story on a calm loop. Under reduced motion there is no ghost and no
 * flowing dots; clicks still change the map at once.
 */
export function ServiceMapPanel({ map }: Readonly<{ map: ServiceMapCopy }>): ReactNode {
  const [parts] = useState(() => composeServiceMap(map));
  const boxRef = useRef<HTMLDivElement>(null);
  const onScreen = useInView(boxRef, { margin: "0px 0px -10% 0px" });
  const reduced = useReducedMotion() === true;
  const [message, setMessage] = useState("");
  const { motion, still, runner, announcer, director, surface } = parts;

  useEffect(() => {
    if (!onScreen) {
      motion.stop();
      still.stop();
    } else if (reduced) {
      motion.stop();
      still.start();
    } else {
      still.stop();
      motion.start();
    }
  }, [onScreen, reduced, motion, still]);

  useEffect(
    () => () => {
      motion.stop();
      still.stop();
    },
    [motion, still],
  );

  useEffect(() => runner.listen((events) => setMessage(events.map((event) => announcer.say(event)).join(" "))), [runner, announcer]);

  return (
    <AppStage label={map.label} boxRef={boxRef} ghost={director} screen={surface} rest={REST}>
      <OpsWindow copy={map} parts={parts} live={onScreen} reduced={reduced} message={message} />
    </AppStage>
  );
}
