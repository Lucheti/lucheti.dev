"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { Progress, Signal } from "@/story";
import { cx } from "@/ui";
import type { PipelineTimeline } from "./PipelineTimeline";

type PipelineRailProps = Readonly<{
  stages: readonly string[];
  /** The ticket id shown on the token. */
  ticket: string;
  progress: Signal<Progress>;
  timeline: PipelineTimeline;
  litStages: number;
}>;

/** Percent along the rail of stage `index`. */
function stageOffset(index: number, count: number): number {
  return (index / (count - 1)) * 100;
}

function labelAlignment(index: number, count: number): string {
  if (index === 0) {
    return "";
  }
  return index === count - 1 ? "-translate-x-full" : "-translate-x-1/2";
}

/**
 * The seven-stage rail. The ticket and the orange fill follow scroll directly
 * through style writes; only the stage lights (a discrete step) come in as props.
 */
export function PipelineRail({ stages, ticket, progress, timeline, litStages }: PipelineRailProps): ReactNode {
  const moverRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const place = (value: Progress): void => {
      const fraction = timeline.tokenAt(value.toNumber());
      if (moverRef.current) {
        moverRef.current.style.transform = `translate3d(${fraction * 100}%, 0, 0)`;
      }
      if (fillRef.current) {
        fillRef.current.style.transform = `scaleX(${fraction})`;
      }
    };
    place(progress.current());
    return progress.subscribe(place);
  }, [progress, timeline]);

  return (
    <div className="relative h-[72px]" role="img" aria-label={`Pipeline: ${stages.join(", ")}`}>
      <div aria-hidden className="absolute inset-x-0 top-9 h-px bg-line-dark-strong" />
      <div
        ref={fillRef}
        aria-hidden
        className="absolute inset-x-0 top-9 h-px origin-left bg-signal will-change-transform"
        style={{ transform: "scaleX(0)" }}
      />
      {stages.map((stage, index) => {
        const lit = index < litStages;
        return (
          <div key={stage} aria-hidden>
            <span
              className={cx(
                "absolute top-9 size-2.5 -translate-x-1/2 -translate-y-1/2 border transition-colors duration-300",
                lit ? "border-signal bg-signal" : "border-line-dark-strong bg-graphite",
              )}
              style={{ left: `${stageOffset(index, stages.length)}%` }}
            />
            <span
              className={cx(
                "absolute top-[50px] whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.14em] transition-colors duration-300 md:text-[11px]",
                labelAlignment(index, stages.length),
                lit ? "text-fog" : "text-fog-dim",
              )}
              style={{ left: `${stageOffset(index, stages.length)}%` }}
            >
              {stage}
            </span>
          </div>
        );
      })}
      <div
        ref={moverRef}
        aria-hidden
        className="absolute left-0 top-9 h-0 w-full will-change-transform"
        style={{ transform: "translate3d(0, 0, 0)" }}
      >
        <div className="absolute -top-[30px] left-0 flex -translate-x-1/2 flex-col items-center">
          <span className="bg-signal px-1.5 py-[3px] font-mono text-[10px] font-medium leading-none text-graphite">
            {ticket}
          </span>
          <span className="h-2.5 w-px bg-signal" />
        </div>
      </div>
    </div>
  );
}
