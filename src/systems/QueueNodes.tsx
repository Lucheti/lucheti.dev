"use client";

import { AnimatePresence, motion, MotionConfig, type Transition } from "motion/react";
import type { ReactNode } from "react";
import type { PanelNode, QueuePanel } from "@/content";
import { ToolSwatch } from "@/ui";
import type { ElementRef } from "./queue/FlightPainter";

/** Dots drawn in the queue; the rest are counted as "+N". */
const QUEUE_DOTS = 8;

/** A message landing in the queue pops in; the line closes up when the head leaves. */
const POP: Transition = { type: "spring", stiffness: 520, damping: 28 };

/** A shopping bag: brand-neutral, small. */
function BagGlyph(): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-4">
      <path
        d="M3.5 5.5h9l-.7 8h-7.6l-.7-8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M6 7V4.5a2 2 0 0 1 4 0V7" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

type ProducerProps = Readonly<{ producer: QueuePanel["producer"]; anchor: ElementRef }>;

/** The service that publishes messages: an ink disc with its name under it. */
export function Producer({ producer, anchor }: ProducerProps): ReactNode {
  return (
    <div className="flex w-16 shrink-0 flex-col items-center gap-1 text-center">
      <span ref={anchor} className="grid size-9 place-items-center rounded-full bg-ink text-white">
        <BagGlyph />
      </span>
      <span className="max-w-full truncate text-[12px] font-semibold leading-4">{producer.name}</span>
      <span className="text-[10px] font-medium uppercase leading-3 tracking-[0.08em] text-mute">{producer.role}</span>
    </div>
  );
}

type QueueProps = Readonly<{
  broker: PanelNode;
  /** The ids waiting, head first. */
  queued: readonly number[];
  label: string;
  tailAnchor: ElementRef;
  headAnchor: ElementRef;
}>;

/**
 * The broker: its name and depth over a row of waiting messages, the head (next to be dealt) on the
 * right. New messages pop in at the tail; past eight, the rest are counted as "+N".
 */
export function Queue({ broker, queued, label, tailAnchor, headAnchor }: QueueProps): ReactNode {
  const shown = queued.slice(0, QUEUE_DOTS).reverse();
  const hidden = queued.length - shown.length;

  return (
    <div className="min-w-0 flex-1 rounded-xl bg-paper-raised px-2.5 py-2 ring-1 ring-inset ring-line">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <ToolSwatch tool={broker.tool} size="sm" />
          <span className="truncate text-[13px] font-semibold leading-5">{broker.name}</span>
          {broker.detail ? <span className="text-[11px] text-mute lg:max-xl:hidden">{broker.detail}</span> : null}
        </span>
        <span className="flex shrink-0 items-baseline gap-1">
          <span className="font-dot text-lg font-bold leading-none tabular-nums">{queued.length}</span>
          <span className="sr-only">{label}</span>
        </span>
      </div>
      <div aria-hidden className="relative mt-2 flex h-3 items-center justify-end gap-[3px] overflow-hidden">
        {hidden > 0 ? (
          <span className="mr-0.5 text-[10px] font-semibold leading-none tabular-nums text-signal-ink">+{hidden}</span>
        ) : null}
        <span className="relative w-0 self-stretch">
          <span ref={tailAnchor} className="absolute -left-1 top-1/2 size-0" />
        </span>
        <MotionConfig reducedMotion="user">
          <AnimatePresence initial={false}>
            {shown.map((id) => (
              <motion.span
                key={id}
                layout="position"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={POP}
                className="size-2 shrink-0 rounded-full bg-signal"
              />
            ))}
          </AnimatePresence>
        </MotionConfig>
        <span ref={headAnchor} className="absolute right-1 top-1/2 size-0" />
      </div>
    </div>
  );
}
