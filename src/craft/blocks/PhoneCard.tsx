"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence, motion, useAnimate, type Transition, type Variants } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { cx } from "@/ui";
import type { CardBlock } from "./CardLayout";

/** The droppable id of the card itself. */
export const CARD_ID = "phone-card";

/** The soft spring blocks drop in, close up and settle with. */
const SPRING: Transition = { type: "spring", stiffness: 420, damping: 26, mass: 0.8 };
const INSTANT: Transition = { duration: 0 };

/** How a block arrives and leaves; `custom` is true when it leaves without a trace (dragged off, or reduced motion). */
const BLOCK_VARIANTS: Variants = {
  hidden: { opacity: 0, y: -10, scale: 0.92 },
  shown: { opacity: 1, y: 0, scale: 1 },
  gone: (instant: boolean) =>
    instant ? { opacity: 0, transition: INSTANT } : { opacity: 0, scale: 0.9, transition: { duration: 0.16, ease: "easeOut" } },
};

/** Where a shelf chip would land: a short orange line in the gap above the block, or under the last one. */
function InsertLine({ edge }: Readonly<{ edge: "top" | "bottom" }>): ReactNode {
  return (
    <span
      aria-hidden
      className={cx(
        "pointer-events-none absolute inset-x-0 z-10 flex items-center",
        edge === "top" ? "-top-[7px]" : "-bottom-[7px]",
      )}
    >
      <span className="size-1.5 rounded-full bg-signal" />
      <span className="h-0.5 flex-1 rounded-full bg-signal" />
      <span className="size-1.5 rounded-full bg-signal" />
    </span>
  );
}

type PhoneCardProps = Readonly<{
  label: string;
  blocks: readonly CardBlock[];
  /** Where a dragged shelf chip would land, or null. */
  insertAt: number | null;
  /** A shelf chip is over the card. */
  receiving: boolean;
  /** The chip over the card doesn't fit. */
  full: boolean;
  /** Bumped each time a block is refused: the card shakes its head. */
  shakes: number;
  /** Blocks stop gliding into new places: while a dragged block settles, and under reduced motion. */
  still: boolean;
  /** The next block to leave goes without a fade: it was dragged off. */
  instantExit: boolean;
  /** Draws a block, sortable, by id. */
  renderBlock: (block: CardBlock) => ReactNode;
  /** Shown under the card for a moment, e.g. when a block doesn't fit. */
  notice: string | null;
}>;

/**
 * The phone card the blocks stack on: a droppable white card on a dotted well. Blocks drop in with a soft
 * spring and the others glide to make room; an orange line shows where a dragged chip will land.
 */
export function PhoneCard({
  label,
  blocks,
  insertAt,
  receiving,
  full,
  shakes,
  still,
  instantExit,
  renderBlock,
  notice,
}: PhoneCardProps): ReactNode {
  const { setNodeRef } = useDroppable({ id: CARD_ID });
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const ids = blocks.map((block) => block.id);

  useEffect(() => {
    if (shakes > 0 && scope.current !== null) {
      animate(scope.current, { x: [0, -7, 6, -4, 3, 0] }, { duration: 0.42, ease: "easeInOut" });
    }
  }, [shakes, animate, scope]);

  return (
    <div className="relative flex min-w-0 flex-1 items-start justify-center rounded-2xl bg-paper bg-[radial-gradient(rgb(14_14_14/0.1)_1px,transparent_1.3px)] [background-size:14px_14px] p-3 sm:p-4">
      <div ref={scope} className="w-full max-w-[17.5rem]">
        <div
          ref={setNodeRef}
          role="group"
          aria-label={label}
          className={cx(
            "relative min-h-40 rounded-[1.6rem] bg-white px-5 pb-5 pt-6 shadow-[0_28px_50px_-30px_rgb(14_14_14/0.5),0_2px_6px_-2px_rgb(14_14_14/0.08)] transition-[box-shadow] duration-200",
            cardRing(receiving, full),
          )}
        >
          <span aria-hidden className="absolute left-1/2 top-2.5 h-1 w-9 -translate-x-1/2 rounded-full bg-ink/10" />
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className="relative flex flex-col gap-2">
              <AnimatePresence initial={false} mode="popLayout" custom={instantExit || still}>
                {blocks.map((block, index) => (
                  <motion.div
                    key={block.id}
                    layout={still ? false : "position"}
                    custom={instantExit || still}
                    variants={BLOCK_VARIANTS}
                    initial="hidden"
                    animate="shown"
                    exit="gone"
                    transition={still ? INSTANT : SPRING}
                    className="relative"
                  >
                    {insertAt === index && !full ? <InsertLine edge="top" /> : null}
                    {insertAt === blocks.length && index === blocks.length - 1 && !full ? <InsertLine edge="bottom" /> : null}
                    {renderBlock(block)}
                  </motion.div>
                ))}
              </AnimatePresence>
              {blocks.length === 0 ? (
                <div
                  className={cx(
                    "flex h-28 items-center justify-center rounded-xl border border-dashed text-[12px] text-ink-soft transition-colors",
                    receiving ? "border-signal bg-signal-soft" : "border-line-strong",
                  )}
                >
                  <svg aria-hidden viewBox="0 0 16 16" className="size-5 text-ink/30" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round">
                    <path d="M8 3.5v9M3.5 8h9" />
                  </svg>
                </div>
              ) : null}
            </div>
          </SortableContext>
        </div>
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-x-3 bottom-3 z-30 flex justify-center">
        <AnimatePresence>
          {notice !== null ? (
            <motion.p
              key={notice}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4 }}
              transition={SPRING}
              className="max-w-full rounded-full bg-ink px-3.5 py-1.5 text-center text-[11.5px] font-medium leading-snug text-white shadow-[0_10px_24px_-10px_rgb(14_14_14/0.6)]"
            >
              {notice}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** The card's edge: an orange ring while a chip that fits is over it, a grey one while one that doesn't is. */
function cardRing(receiving: boolean, full: boolean): string {
  if (!receiving) {
    return "ring-1 ring-ink/10";
  }
  return full ? "ring-2 ring-ink/25" : "ring-2 ring-signal/70";
}
