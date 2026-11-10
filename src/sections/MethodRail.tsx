"use client";

import { motion, useScroll } from "motion/react";
import { useRef, type ReactNode } from "react";

/** Vertical hairline whose lime fill follows the reader through the list. */
export function MethodRail({ children }: { readonly children: ReactNode }): ReactNode {
  const listRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ["start 65%", "end 55%"],
  });

  return (
    <div className="relative pl-8 md:pl-14">
      <span aria-hidden className="absolute bottom-0 left-0 top-0 w-px bg-line" />
      <motion.span
        aria-hidden
        className="absolute bottom-0 left-0 top-0 w-px origin-top bg-lime"
        style={{ scaleY: scrollYProgress }}
      />
      <ol ref={listRef} className="flex flex-col gap-16 md:gap-20">
        {children}
      </ol>
    </div>
  );
}
