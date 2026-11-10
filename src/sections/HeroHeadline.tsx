"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cx, EASE_OUT_EXPO } from "@/ui";

const STAGGER_SECONDS = 0.08;

/** The h1: each line rises from behind its own mask; the last one is lime. */
export function HeroHeadline({ lines }: { readonly lines: readonly string[] }): ReactNode {
  return (
    <h1 className="font-display text-[clamp(3.5rem,11vw,10rem)] font-semibold leading-[0.92] tracking-[-0.045em] text-bone">
      {lines.map((line, index) => {
        const isLast = index === lines.length - 1;
        return (
          <span
            key={line}
            className="-mb-[0.08em] block w-max max-w-full overflow-hidden pb-[0.08em] lg:max-w-none"
          >
            <motion.span
              className={cx("block whitespace-nowrap", isLast && "text-lime")}
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.9, delay: 0.1 + index * STAGGER_SECONDS, ease: EASE_OUT_EXPO }}
            >
              {line}
            </motion.span>
          </span>
        );
      })}
    </h1>
  );
}
