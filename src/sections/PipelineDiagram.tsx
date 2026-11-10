"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { cx } from "@/ui";

/** Presentation detail of the Orchestra loop, not site copy. */
const STAGES = ["Idea", "PRD", "Cards", "Review", "QA", "Release"] as const;
const LAST_INDEX = STAGES.length - 1;
const PASS_SECONDS = 6;
const PAUSE_SECONDS = 1.2;
const EPSILON = 1e-6;

/** Six nodes on a hairline; a lime pulse crosses them and lights each in turn. */
export function PipelineDiagram(): ReactNode {
  const reducedMotion = useReducedMotion();
  const progress = useMotionValue(0);
  const pulseLeft = useTransform(progress, (value) => `${value * 100}%`);
  const [reached, setReached] = useState(1);

  useEffect(() => {
    if (reducedMotion) {
      return undefined;
    }
    const stopListening = progress.on("change", (value) => {
      setReached(Math.floor(value * LAST_INDEX + EPSILON) + 1);
    });
    const loop = animate(progress, 1, {
      duration: PASS_SECONDS,
      ease: "linear",
      repeat: Infinity,
      repeatDelay: PAUSE_SECONDS,
    });
    return () => {
      stopListening();
      loop.stop();
    };
  }, [reducedMotion, progress]);

  const litCount = reducedMotion ? STAGES.length : reached;

  return (
    <div role="img" aria-label={`Delivery pipeline: ${STAGES.join(", ")}`} className="relative grid grid-cols-6">
      <div aria-hidden className="absolute inset-x-[calc(100%/12)] top-1.5 h-px bg-line-strong" />
      <div aria-hidden className="absolute inset-x-[calc(100%/12)] top-1.5">
        <motion.span
          className="absolute left-0 top-0 h-px w-full origin-left bg-lime/60"
          style={{ scaleX: reducedMotion ? 1 : progress }}
        />
        {!reducedMotion && (
          <motion.span
            className="absolute top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime ring-8 ring-lime-glow"
            style={{ left: pulseLeft }}
          />
        )}
      </div>
      {STAGES.map((stage, index) => {
        const lit = index < litCount;
        return (
          <div key={stage} className="relative z-10 flex flex-col items-center gap-4">
            <span
              aria-hidden
              className={cx(
                "size-3 rounded-full border transition-colors duration-500 ease-out-expo",
                lit ? "border-lime bg-lime" : "border-line-strong bg-ink-raised",
              )}
            />
            <span
              className={cx(
                "font-mono text-[10px] uppercase tracking-[0.1em] transition-colors duration-500 sm:text-[11px] sm:tracking-[0.14em]",
                lit ? "text-bone" : "text-bone-dim",
              )}
            >
              {stage}
            </span>
          </div>
        );
      })}
    </div>
  );
}
