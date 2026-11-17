"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import type { TaskStatus } from "@/content";
import { assertNever } from "../layers/assertNever";

/** The ring's colour for each status: a quiet grey to do, amber in progress, the signal orange when done. */
function ringOf(status: TaskStatus): string {
  switch (status) {
    case "todo":
      return "#b3b1ab";
    case "doing":
      return "#e5a13a";
    case "done":
      return "#ff5a1f";
    default:
      return assertNever(status);
  }
}

const SPRING = { type: "spring", stiffness: 520, damping: 26, mass: 0.7 } as const;
const CENTRED = { transformBox: "fill-box", transformOrigin: "center" } as const;

type StatusIconProps = Readonly<{
  status: TaskStatus;
  /** It has just been finished: the tick draws itself and a ring bursts out once. */
  celebrate: boolean;
  className?: string;
}>;

/**
 * A task's status, the way task trackers draw it: an empty ring to do, a half-filled ring in progress, and a
 * filled disc with a tick when done. Finishing a task fills the disc with a little overshoot, draws the tick
 * and sends a ring outward.
 */
export function StatusIcon({ status, celebrate, className }: StatusIconProps): ReactNode {
  const done = status === "done";
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} overflow="visible">
      {celebrate && done ? (
        <motion.circle
          cx="8"
          cy="8"
          r="6.5"
          fill="none"
          stroke="#ff5a1f"
          strokeWidth="1.4"
          style={CENTRED}
          initial={{ scale: 0.9, opacity: 0.6 }}
          animate={{ scale: 2.1, opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      ) : null}
      <motion.circle
        cx="8"
        cy="8"
        r="6.25"
        fill="none"
        strokeWidth="1.5"
        initial={false}
        animate={{ stroke: ringOf(status) }}
        transition={{ duration: 0.2 }}
      />
      <motion.path
        d="M8 3.25a4.75 4.75 0 0 1 0 9.5z"
        fill="#e5a13a"
        initial={false}
        animate={{ opacity: status === "doing" ? 1 : 0 }}
        transition={{ duration: 0.15 }}
      />
      <motion.circle
        cx="8"
        cy="8"
        r="7"
        fill="#ff5a1f"
        style={CENTRED}
        initial={false}
        animate={{ scale: done ? 1 : 0 }}
        transition={done ? SPRING : { duration: 0.15 }}
      />
      <motion.path
        d="m4.9 8.2 2.1 2.1 4.1-4.4"
        fill="none"
        stroke="#fff"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }}
        transition={done ? { pathLength: { duration: 0.28, delay: 0.1, ease: "easeOut" }, opacity: { duration: 0.01, delay: 0.1 } } : { duration: 0.1 }}
      />
    </svg>
  );
}
