"use client";

import Lenis from "lenis";
import { useReducedMotion } from "motion/react";
import { useEffect, type ReactNode } from "react";

/**
 * Eases wheel and anchor scrolling so scroll-driven layers glide instead of
 * stepping. Left off entirely for readers who ask for reduced motion.
 */
export function SmoothScroll(): ReactNode {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      return undefined;
    }
    const lenis = new Lenis({ autoRaf: true, anchors: true, lerp: 0.09 });
    return () => lenis.destroy();
  }, [reducedMotion]);

  return null;
}
