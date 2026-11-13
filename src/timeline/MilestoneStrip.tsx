import type { ReactNode } from "react";
import type { TimelineMilestone } from "@/content";

type MilestoneStripProps = Readonly<{
  milestone: TimelineMilestone;
  /** The milestone's kind, already resolved to its display name. */
  kindLabel: string;
  /** Centre of the strip, in track coordinates. */
  x: number;
}>;

/** One career milestone: an orange strip down to the axis, a node on it, and the label beside it. */
export function MilestoneStrip({ milestone, kindLabel, x }: MilestoneStripProps): ReactNode {
  return (
    <>
      <span aria-hidden className="absolute top-0 h-[52%] w-0.5 bg-signal" style={{ left: x - 1 }} />
      <span
        aria-hidden
        className="absolute top-[52%] size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-signal"
        style={{ left: x }}
      />
      <div className="absolute top-[36%] pl-4" style={{ left: x, width: "calc(var(--stop-gap) * 0.5)" }}>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-signal-ink">
          {kindLabel} · {milestone.date}
        </p>
        <p className="mt-1.5 font-display text-2xl font-semibold leading-[1.05] tracking-[-0.03em] text-signal md:text-[26px]">
          {milestone.label}
        </p>
        <p className="mt-2 text-sm leading-[1.45] text-ink-soft" style={{ maxWidth: "min(24ch, 100%)" }}>
          {milestone.note}
        </p>
      </div>
    </>
  );
}
