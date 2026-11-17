"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import type { Hero } from "@/content";
import { EASE_OUT_EXPO, cx } from "@/ui";

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

type CornerGeometry = Readonly<{
  /** Where the corner sits inside the sheet; the top ones clear the 56px nav. */
  place: string;
  horizontal: string;
  vertical: string;
}>;

const CORNERS: Readonly<Record<Corner, CornerGeometry>> = {
  "top-left": { place: "left-6 top-20", horizontal: "left-0 top-0 origin-left", vertical: "left-0 top-0 origin-top" },
  "top-right": { place: "right-6 top-20", horizontal: "right-0 top-0 origin-right", vertical: "right-0 top-0 origin-top" },
  "bottom-left": {
    place: "bottom-6 left-6",
    horizontal: "bottom-0 left-0 origin-left",
    vertical: "bottom-0 left-0 origin-bottom",
  },
  "bottom-right": {
    place: "bottom-6 right-6",
    horizontal: "bottom-0 right-0 origin-right",
    vertical: "bottom-0 right-0 origin-bottom",
  },
};

const CORNER_ORDER: readonly Corner[] = ["top-left", "top-right", "bottom-left", "bottom-right"];
const MARK_SIZE = "16px";
const DRAW = { duration: 0.7, delay: 0.25, ease: EASE_OUT_EXPO } as const;

/** One L-shaped crop mark, drawn in from its corner. */
function CropMark({ corner }: { readonly corner: Corner }): ReactNode {
  const geometry = CORNERS[corner];
  return (
    <span aria-hidden className={cx("absolute block", geometry.place)} style={{ width: MARK_SIZE, height: MARK_SIZE }}>
      <motion.span
        className={cx("absolute block h-px bg-ink", geometry.horizontal)}
        style={{ width: MARK_SIZE }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={DRAW}
      />
      <motion.span
        className={cx("absolute block w-px bg-ink", geometry.vertical)}
        style={{ height: MARK_SIZE }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={DRAW}
      />
    </span>
  );
}

const ANNOTATION =
  "absolute font-label font-medium text-[11px] uppercase leading-none tracking-[0.14em] text-mute";

/** A short vertical tick with a bead that slides down it, hinting at the scroll. */
function ScrollTick(): ReactNode {
  return (
    <span aria-hidden className="relative block h-6 w-px overflow-hidden bg-line-strong">
      <motion.span
        className="absolute left-0 top-0 block h-2 w-px bg-ink"
        animate={{ y: [-8, 24] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.4 }}
      />
    </span>
  );
}

/** The spec-sheet frame: crop marks in the corners and the sheet annotations. */
export function SheetFrame({ sheet }: { readonly sheet: Hero["sheet"] }): ReactNode {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[5]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {CORNER_ORDER.map((corner) => (
        <CropMark key={corner} corner={corner} />
      ))}
      <p className={cx(ANNOTATION, "left-[3.25rem] top-20")}>
        {sheet.code} — {sheet.title}
      </p>
      <p className={cx(ANNOTATION, "right-[3.25rem] top-20 hidden sm:block")}>{sheet.revision}</p>
      <div className="absolute bottom-6 right-[3.25rem] flex items-end gap-3">
        <span className="font-label font-medium text-[11px] uppercase leading-none tracking-[0.14em] text-mute">{sheet.scroll}</span>
        <ScrollTick />
      </div>
    </motion.div>
  );
}
