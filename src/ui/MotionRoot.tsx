"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/** Makes every Motion animation below it respect prefers-reduced-motion. */
export function MotionRoot({ children }: { readonly children: ReactNode }): ReactNode {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
