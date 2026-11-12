"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";
import type { LogLine } from "@/content";

type AgentLogProps = Readonly<{
  lines: readonly LogLine[];
  /** How many of `lines` are revealed. */
  visible: number;
}>;

const VISIBLE_ROWS = 7;
const CURSOR_BLINK: Pick<HTMLMotionProps<"span">, "animate" | "transition"> = {
  animate: { opacity: [1, 1, 0, 0] },
  transition: { duration: 1.1, times: [0, 0.5, 0.5, 1], repeat: Infinity, ease: "linear" },
};

/** A small terminal that shows the log up to `visible`, newest last. */
export function AgentLog({ lines, visible }: AgentLogProps): ReactNode {
  const reducedMotion = useReducedMotion() === true;
  const shown = lines.slice(Math.max(0, visible - VISIBLE_ROWS), visible);

  return (
    <div
      role="log"
      aria-label="Agent log"
      className="h-[calc(7*1.25rem+1.5rem)] w-[320px] overflow-hidden rounded-md border border-line-dark bg-graphite-raised px-3 py-3 font-mono text-xs leading-5"
    >
      {shown.map((line, index) => {
        const last = index === shown.length - 1;
        return (
          <p key={`${line.actor}-${visible - shown.length + index}`} className="truncate text-fog">
            <span className="text-signal">{line.actor}</span> {line.message}
            {last && (
              <motion.span
                aria-hidden
                className="ml-1 inline-block h-3 w-1.5 translate-y-0.5 bg-fog"
                {...(reducedMotion ? {} : CURSOR_BLINK)}
              />
            )}
          </p>
        );
      })}
    </div>
  );
}
