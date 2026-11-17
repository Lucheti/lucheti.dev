"use client";

import { useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { FrameSequencePlayer, StillProgress } from "@/backdrop";
import type { FrameSequence, Orchestra } from "@/content";
import type { Progress, Signal } from "@/story";
import { Container, cx, SectionHeader } from "@/ui";
import { ACTIVITY } from "./ActivityClasses";
import { CompactBoard } from "./CompactBoard";
import { CountStat } from "./CountStat";
import { DepartmentBoard } from "./DepartmentBoard";
import { DispatchLog } from "./DispatchLog";
import { LifecycleScript, type BoardState } from "./LifecycleScript";
import { Roster } from "./Roster";

type OrchestraStageProps = Readonly<{
  orchestra: Orchestra;
  sequence: FrameSequence;
  /** 0 when the pinned frame sticks, 1 when it lets go. */
  progress: Signal<Progress>;
}>;

const FOCAL_X = 0.62;
/** Where the video rests when motion is reduced: the core in clear view. */
const STILL_FRACTION = 0.7;
const STAT_STAGGER_SECONDS = 0.1;

const LEFT_SCRIM = "linear-gradient(to right, rgb(18 18 18 / 0.85), rgb(18 18 18 / 0) 55%)";
const BOTTOM_SCRIM = "linear-gradient(to top, rgb(18 18 18), rgb(18 18 18 / 0))";

/**
 * This chapter shares one pinned viewport between the copy and the board, so
 * the shared SectionHeader is sized by viewport height as well as width here:
 * heading, intro and gaps shrink on short screens instead of being cut off.
 */
const HEADER_FIT = cx(
  "[&_header]:gap-3 lg:[&_header]:gap-4",
  "[&_h2]:text-[clamp(1.75rem,min(7.5vw,4.6dvh),2.75rem)] lg:[&_h2]:text-[clamp(2rem,min(3.4vw,6.2dvh),4.5rem)]",
  "[&_header>div:last-child>p]:text-[15px] lg:[&_header>div:last-child>p]:text-base 2xl:[&_header>div:last-child>p]:text-lg",
);
const GROUP_GAP = "mt-[clamp(0.75rem,2.6dvh,2rem)]";

/** The pinned frame: video, copy, the department board and the dispatch log, all scroll-linked. */
export function OrchestraStage({ orchestra, sequence, progress: pin }: OrchestraStageProps): ReactNode {
  const reducedMotion = useReducedMotion() === true;
  const [still] = useState(() => new StillProgress(STILL_FRACTION));
  const [roster] = useState(() => Roster.of(orchestra.departments, orchestra.steps));
  const [script] = useState(() => new LifecycleScript(orchestra.steps, roster, orchestra.principles.length));
  const [state, setState] = useState<BoardState>(() => script.stateAt(0));
  const frameRef = useRef<HTMLDivElement>(null);
  const onScreen = useInView(frameRef);

  useEffect(() => {
    const apply = (): void => {
      const next = script.stateAt(pin.current().toNumber());
      setState((previous) => (LifecycleScript.same(previous, next) ? previous : next));
    };
    apply();
    return pin.subscribe(apply);
  }, [pin, script]);

  return (
    <div ref={frameRef} className={cx("sticky top-0 h-dvh overflow-hidden", !onScreen && ACTIVITY.paused)}>
      <FrameSequencePlayer sequence={sequence} progress={reducedMotion ? still : pin} focalX={FOCAL_X} />
      <div aria-hidden className="absolute inset-0 bg-graphite/55 lg:bg-graphite/30" />
      <div aria-hidden className="absolute inset-0" style={{ background: LEFT_SCRIM }} />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[30%]" style={{ background: BOTTOM_SCRIM }} />
      <div aria-hidden className="absolute inset-0 bg-grid-dark opacity-60" />

      <Container className="relative flex h-full flex-col gap-[clamp(1rem,3dvh,2rem)] pb-4 pt-[4.5rem] lg:flex-row lg:gap-10 lg:pb-[clamp(1rem,4dvh,2.5rem)] lg:pt-[clamp(4.5rem,11dvh,6rem)] xl:gap-14">
        <div className={cx("flex flex-col lg:w-[34%] lg:justify-center xl:w-[36%]", HEADER_FIT)}>
          <SectionHeader
            label={orchestra.label}
            heading={orchestra.heading}
            intro={orchestra.intro}
            tone="dark"
          />
          <ol className={cx(GROUP_GAP, "flex flex-col gap-2 lg:gap-2.5")}>
            {orchestra.principles.map((principle, index) => (
              <li
                key={principle}
                className={cx(
                  "flex gap-4 transition-[opacity,transform] duration-700 ease-out-expo motion-reduce:transition-none",
                  index < state.principles ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
                )}
              >
                <span className="pt-[4px] font-label text-[11px] tracking-[0.16em] text-signal">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-[15px] leading-[1.45] text-fog lg:text-base 2xl:text-[17px]">{principle}</span>
              </li>
            ))}
          </ol>
          <div className={cx(GROUP_GAP, "flex gap-8 md:gap-12")}>
            {orchestra.stats.map((stat, index) => (
              <CountStat key={stat.label} stat={stat} shown={state.statsShown} delay={index * STAT_STAGGER_SECONDS} />
            ))}
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 flex-col justify-center gap-4 lg:flex">
          <DepartmentBoard roster={roster} script={script} state={state} progress={pin} />
          <DispatchLog script={script} roster={roster} dispatched={state.dispatched} />
        </div>

        <CompactBoard roster={roster} state={state} className="lg:hidden" />
      </Container>
    </div>
  );
}
