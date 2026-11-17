"use client";

import { useInView, useReducedMotion } from "motion/react";
import type { RefObject } from "react";

/**
 * Whether a feature panel's loop should run: only while the panel is on screen, and never when the
 * visitor prefers reduced motion. False on the server and before hydration, so the first paint is static.
 */
export function usePanelLoop(target: RefObject<Element | null>): boolean {
  const reduced = useReducedMotion() === true;
  const onScreen = useInView(target, { margin: "0px 0px -10% 0px" });
  return onScreen && !reduced;
}
