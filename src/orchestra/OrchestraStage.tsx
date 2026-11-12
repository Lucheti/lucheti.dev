"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FrameSequencePlayer, StillProgress } from "@/backdrop";
import type { FrameSequence, Orchestra } from "@/content";
import { useStory } from "@/story";
import { Container, cx, SectionHeader } from "@/ui";
import { AgentLog } from "./AgentLog";
import { CountStat } from "./CountStat";
import { PinProgress } from "./PinProgress";
import { PipelineRail } from "./PipelineRail";
import { PipelineTimeline, type PipelineState } from "./PipelineTimeline";

type OrchestraStageProps = Readonly<{
  orchestra: Orchestra;
  sequence: FrameSequence;
  /** Height of the chapter in dvh; the sticky frame is one viewport of it. */
  chapterDvh: number;
}>;

const CHAPTER_INDEX = "05";
const TICKET_ID = "F-12";
const FOCAL_X = 0.62;
/** Where the video rests when motion is reduced: the core in clear view. */
const STILL_FRACTION = 0.7;
const STAT_STAGGER_SECONDS = 0.1;

const LEFT_SCRIM = "linear-gradient(to right, rgb(18 18 18 / 0.85), rgb(18 18 18 / 0) 55%)";
const BOTTOM_SCRIM = "linear-gradient(to top, rgb(18 18 18), rgb(18 18 18 / 0))";

/** The pinned frame: video, copy, pipeline rail and agent log, all scroll-linked. */
export function OrchestraStage({ orchestra, sequence, chapterDvh }: OrchestraStageProps): ReactNode {
  const story = useStory();
  const reducedMotion = useReducedMotion() === true;
  const pin = useMemo(() => PinProgress.ofStickyFrame(story.through("orchestra"), chapterDvh), [story, chapterDvh]);
  const [still] = useState(() => new StillProgress(STILL_FRACTION));
  const [timeline] = useState(
    () =>
      new PipelineTimeline({
        principles: orchestra.principles.length,
        stages: orchestra.stages.length,
        logLines: orchestra.log.length,
      }),
  );
  const [state, setState] = useState<PipelineState>(() => timeline.stateAt(0));

  useEffect(() => {
    const apply = (): void => {
      const next = timeline.stateAt(pin.current().toNumber());
      setState((previous) => (PipelineTimeline.same(previous, next) ? previous : next));
    };
    apply();
    return pin.subscribe(apply);
  }, [pin, timeline]);

  return (
    <div className="sticky top-0 h-dvh overflow-hidden">
      <FrameSequencePlayer
        sequence={sequence}
        progress={reducedMotion ? still : pin}
        focalX={FOCAL_X}
      />
      <div aria-hidden className="absolute inset-0 bg-graphite/55 lg:hidden" />
      <div aria-hidden className="absolute inset-0" style={{ background: LEFT_SCRIM }} />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[30%]" style={{ background: BOTTOM_SCRIM }} />
      <div aria-hidden className="absolute inset-0 bg-grid-dark opacity-60" />

      <Container className="relative flex h-full flex-col pb-36 pt-20 lg:pt-24">
        <div className="lg:w-[44%]">
          <SectionHeader
            index={CHAPTER_INDEX}
            label={orchestra.label}
            heading={orchestra.heading}
            intro={orchestra.intro}
            tone="dark"
          />
          <ol className="mt-[clamp(1rem,3.5dvh,2.5rem)] flex flex-col gap-3">
            {orchestra.principles.map((principle, index) => (
              <li
                key={principle}
                className={cx(
                  "flex gap-4 transition-[opacity,transform] duration-700 ease-out-expo motion-reduce:transition-none",
                  index < state.principles ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
                )}
              >
                <span className="pt-[5px] font-mono text-[11px] tracking-[0.16em] text-signal">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-[17px] leading-[1.5] text-fog md:text-lg">{principle}</span>
              </li>
            ))}
          </ol>
          <div className="mt-[clamp(1rem,3.5dvh,2.5rem)] flex gap-8 md:gap-12">
            {orchestra.stats.map((stat, index) => (
              <CountStat
                key={stat.label}
                stat={stat}
                shown={state.statsShown}
                delay={index * STAT_STAGGER_SECONDS}
              />
            ))}
          </div>
        </div>
      </Container>

      <div className="pointer-events-none absolute inset-x-0 bottom-[8.5rem] hidden lg:block">
        <Container className="flex justify-end">
          <AgentLog lines={orchestra.log} visible={state.logLines} />
        </Container>
      </div>

      <div className="absolute inset-x-0 bottom-0 pb-7">
        <Container>
          <PipelineRail
            stages={orchestra.stages}
            ticket={TICKET_ID}
            progress={pin}
            timeline={timeline}
            litStages={state.litStages}
          />
        </Container>
      </div>
    </div>
  );
}
