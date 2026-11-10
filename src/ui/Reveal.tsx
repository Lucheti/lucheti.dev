"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { EASE_OUT_EXPO } from "./motion";

type RevealProps = Readonly<{
  children: ReactNode;
  className?: string;
  /** Seconds to wait before the arrival starts. */
  delay?: number;
  /** "view" waits until the element scrolls in; "mount" plays straight away. */
  trigger?: "view" | "mount";
}>;

const HIDDEN = { opacity: 0, y: 24 } as const;

/** Fades and lifts its children into place once. */
export function Reveal({ children, className, delay = 0, trigger = "view" }: RevealProps): ReactNode {
  const shown = {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay, ease: EASE_OUT_EXPO },
  };

  if (trigger === "mount") {
    return (
      <motion.div className={className} initial={HIDDEN} animate={shown}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={HIDDEN}
      whileInView={shown}
      viewport={{ once: true, margin: "-10% 0px" }}
    >
      {children}
    </motion.div>
  );
}
