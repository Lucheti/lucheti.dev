import type { ReactNode } from "react";
import type { TimelineStop } from "@/content";
import { cx } from "@/ui";
import { sideProjectTag } from "./sideProjectTag";

type StopColumnProps = Readonly<{
  stop: TimelineStop;
  /** Centre of the node, in track coordinates. */
  x: number;
  active: boolean;
  /** False until the entrance has played, for the stop that rises in. */
  shown: boolean;
}>;

/** One stop of the pinned track: node on the axis, the world above it, me below it. */
export function StopColumn({ stop, x, active, shown }: StopColumnProps): ReactNode {
  const isProject = stop.kind === "project";
  const isAi = stop.era === "ai";
  const tag = sideProjectTag(stop);

  return (
    <li className="absolute top-[52%] h-0 list-none" style={{ left: x }}>
      <span
        aria-hidden
        className={cx(
          "absolute left-0 top-0 size-2.5 -translate-x-1/2 -translate-y-1/2 border",
          isProject ? "border-dashed" : "border-solid",
          isAi ? "border-signal" : "border-ink",
          isAi && !isProject ? "bg-signal" : "bg-paper",
        )}
      />
      <div
        className={cx(
          "absolute -left-[5px] top-0 transition-[opacity,transform] duration-300 ease-out-expo",
          active ? "opacity-100" : "opacity-35",
          !shown && "translate-y-6 opacity-0",
        )}
        style={{ width: "calc(var(--stop-gap) - 28px)" }}
      >
        <p
          className="absolute bottom-full left-0 mb-7 text-[15px] leading-[1.45] text-ink-soft md:text-base"
          style={{ width: "min(26ch, calc(var(--stop-gap) * 0.5 - 24px))" }}
        >
          {stop.trend}
        </p>
        <div className="pt-7">
          <p aria-hidden className="font-dot text-[40px] font-semibold leading-none text-mute">
            {stop.year}
          </p>
          <h3 className="mt-3 font-display text-2xl font-semibold leading-[1.05] tracking-[-0.03em] text-ink md:text-[28px]">
            {stop.company}
          </h3>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-mute">{stop.role}</p>
          {tag !== null && (
            <p className="mt-1.5 inline-block border border-dashed border-line-strong px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
              {tag}
            </p>
          )}
          <p className="mt-4 max-w-[28ch] text-base leading-[1.45] text-ink md:text-[17px]">{stop.did}</p>
        </div>
      </div>
    </li>
  );
}
