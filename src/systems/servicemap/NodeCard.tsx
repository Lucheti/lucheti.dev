"use client";

import type { CSSProperties, ReactNode } from "react";
import { INK, WORD_PILL } from "@/laptop";
import { cx, ToolSwatch } from "@/ui";
import type { Signal } from "./cardLook";
import type { Rect } from "./MapLayout";

/** A status dot's fill. */
const DOT: Readonly<Record<Signal, string>> = {
  ok: "bg-[#30a46c]",
  warn: "bg-[#e5a13a]",
  bad: "bg-[#e5484d]",
};

/** A tinted word's colours, like the task tracker's "New". */
const PILL: Readonly<Record<Signal, string>> = {
  ok: "bg-[#e3f4ea] text-[#1f7a4d]",
  warn: "bg-[#fdf0d5] text-[#a8650b]",
  bad: "bg-[#ffe4e1] text-[#c8302c]",
};

/** A card on the canvas: white, softly lifted, with a hairline edge in the app's warm brown. */
export const CARD =
  "absolute flex items-center gap-[8px] rounded-[10px] bg-white pl-[9px] pr-[9px] text-left shadow-[inset_0_0_0_0.5px_rgb(60_30_15/0.17),0_1px_2px_rgb(60_30_15/0.05),0_6px_14px_-8px_rgb(60_30_15/0.2)]";

/** Where a card sits, from the layout. */
export function boxStyle(box: Rect): CSSProperties {
  return { left: box.x, top: box.y, width: box.width, height: box.height };
}

/** A small tinted word: "Down", "Restarting", "Open". */
export function Pill({ signal, children, className }: Readonly<{ signal: Signal; children: ReactNode; className?: string }>): ReactNode {
  return <span className={cx(WORD_PILL, PILL[signal], className)}>{children}</span>;
}

/** The status dot in a card's top-right corner; a failing one rings. */
export function StatusDot({ signal, reduced }: Readonly<{ signal: Signal; reduced: boolean }>): ReactNode {
  return (
    <span aria-hidden className="absolute right-[8px] top-[8px] flex size-[6px]">
      {signal === "bad" && !reduced ? <span className={cx("absolute inset-0 animate-ping rounded-full opacity-60", DOT[signal])} /> : null}
      <span className={cx("relative size-[6px] rounded-full transition-colors duration-300 motion-reduce:transition-none", DOT[signal])} />
    </span>
  );
}

/** A node's mark: its tool's brand swatch, or a quiet circle with a line icon for nodes with no brand. */
export function NodeBadge({ tool, glyph, muted }: Readonly<{ tool?: string; glyph?: ReactNode; muted: boolean }>): ReactNode {
  const fade = cx("transition-[filter,opacity] duration-300 motion-reduce:transition-none", muted && "opacity-45 grayscale");
  if (tool !== undefined) {
    return <ToolSwatch tool={tool} size="sm" className={fade} />;
  }
  return (
    <span aria-hidden className={cx("inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[rgb(60_30_15/0.07)] text-[#4a403b]", fade)}>
      {glyph}
    </span>
  );
}

type NodeTextProps = Readonly<{ name: string; muted: boolean; children: ReactNode }>;

/** A card's name over its small line: a figure, a pill or an action. The name keeps clear of the status dot. */
export function NodeText({ name, muted, children }: NodeTextProps): ReactNode {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
      <span className="truncate pr-[8px] text-[12.5px] font-semibold leading-none tracking-[-0.008em] transition-colors duration-300" style={{ color: muted ? "#a0958e" : INK.strong }}>
        {name}
      </span>
      <span className="relative flex h-[14px] items-center">{children}</span>
    </span>
  );
}

/** A card's figure, in small tabular numbers. */
export function Figure({ children, tone }: Readonly<{ children: ReactNode; tone: "quiet" | "alarm" }>): ReactNode {
  return (
    <span className={cx("truncate text-[11px] font-medium leading-none tabular-nums", tone === "alarm" ? "text-[#c8302c]" : "text-[#8a7f78]")}>{children}</span>
  );
}
