"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Timeline } from "@/content";
import { EASE_OUT_EXPO, SectionHeader } from "@/ui";
import { eraBoundary } from "./eraBoundary";
import { MilestoneStrip } from "./MilestoneStrip";
import { StopColumn } from "./StopColumn";
import { TimelineGeometry } from "./TimelineGeometry";
import { YearReadout } from "./YearReadout";

/** Viewport width assumed until the frame has been measured. */
const FALLBACK_VIEWPORT_WIDTH = 1280;
const SPRING = { stiffness: 200, damping: 40 } as const;
const AXIS_DRAW_SECONDS = 1;
/** Stops that scroll in under the header fade out before they reach it. */
const LEFT_FADE = "linear-gradient(90deg, transparent 0%, transparent 20%, #000 36%)";
const LANE_LABEL = "absolute left-3 font-mono text-[11px] uppercase tracking-[0.16em] text-mute [writing-mode:vertical-rl] rotate-180";

type TrackVars = CSSProperties & { "--stop-gap": string; "--travel": string };

/** The pinned horizontal build log for md and up; phones get the vertical one. */
export function PinnedTimeline({ timeline }: { readonly timeline: Timeline }): ReactNode {
  const { stops, milestones, milestoneKinds, eras, lanes } = timeline;
  const eraAfter = eraBoundary(stops);
  const reducedMotion = useReducedMotion() === true;

  const pinRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [geometry, setGeometry] = useState(
    () => new TimelineGeometry(FALLBACK_VIEWPORT_WIDTH, stops.length, eraAfter),
  );
  const geometryRef = useRef(geometry);
  const [activeIndex, setActiveIndex] = useState(0);
  const entered = useInView(frameRef, { amount: 0.5, once: true });
  const played = entered || reducedMotion;

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return undefined;
    }
    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? 0;
      // A hidden frame (phones) reports zero; keep the last geometry.
      if (width > 0) {
        setGeometry(new TimelineGeometry(width, stops.length, eraAfter));
      }
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, [stops.length, eraAfter]);

  const { scrollYProgress } = useScroll({ target: pinRef, offset: ["start start", "end end"] });
  const rawX = useMotionValue(0);
  const springX = useSpring(rawX, SPRING);
  const trackX = reducedMotion ? rawX : springX;
  const inkScale = useMotionValue(0);
  const orangeScale = useMotionValue(0);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    rawX.set(geometryRef.current.xAt(progress));
  });

  useMotionValueEvent(trackX, "change", (x) => {
    const current = geometryRef.current;
    setActiveIndex(current.activeIndex(x));
    const fill = current.barFill(current.progressAt(x));
    inkScale.set(fill.before);
    orangeScale.set(fill.after);
  });

  useEffect(() => {
    geometryRef.current = geometry;
    const x = geometry.xAt(scrollYProgress.get());
    rawX.set(x);
    springX.jump(x);
  }, [geometry, scrollYProgress, rawX, springX]);

  const eraLeft = geometry.eraX();
  const eraFraction = geometry.eraProgress();
  const vars: TrackVars = {
    "--stop-gap": `${geometry.spacing()}px`,
    "--travel": `${geometry.travel()}px`,
    width: geometry.trackWidth(),
  };
  const pinVars = { "--travel": vars["--travel"] } as CSSProperties;
  const activeStop = stops[activeIndex] ?? stops[0];

  return (
    <div ref={pinRef} className="hidden md:block md:h-[calc(100dvh+var(--travel))]" style={pinVars}>
      <div ref={frameRef} className="sticky top-0 h-dvh overflow-hidden">
        <div aria-hidden className="absolute inset-y-0 left-[42%] border-l border-dashed border-line-strong" />

        <p aria-hidden className={`${LANE_LABEL} bottom-[calc(48%+28px)]`}>
          {lanes.world}
        </p>
        <p aria-hidden className={`${LANE_LABEL} top-[calc(52%+28px)]`}>
          {lanes.me}
        </p>

        <motion.div aria-hidden className="absolute inset-y-0 left-0" style={{ ...vars, x: trackX }}>
          <motion.div
            className="absolute left-0 top-[52%] h-0 w-full origin-left"
            initial={{ scaleX: reducedMotion ? 1 : 0 }}
            animate={{ scaleX: played ? 1 : 0 }}
            transition={{ duration: AXIS_DRAW_SECONDS, ease: EASE_OUT_EXPO }}
          >
            <span className="absolute left-0 top-0 h-px bg-ink" style={{ width: eraLeft }} />
            <span
              className="absolute top-0 h-px bg-signal"
              style={{ left: eraLeft, width: geometry.trackWidth() - eraLeft }}
            />
          </motion.div>
          <p
            className="absolute top-[52%] -translate-y-1/2 bg-paper px-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-soft"
            style={{ left: geometry.stopX(0) - geometry.spacing() / 2 }}
          >
            {eras["pre-ai"]}
          </p>
          <p
            className="absolute top-[52%] -translate-y-1/2 bg-paper px-2 font-mono text-[11px] uppercase tracking-[0.16em] text-signal-ink"
            style={{ left: eraLeft + 16 }}
          >
            {eras.ai} →
          </p>
        </motion.div>

        <div className="absolute inset-0" style={{ maskImage: LEFT_FADE, WebkitMaskImage: LEFT_FADE }}>
          <motion.ol className="absolute inset-y-0 left-0 m-0 p-0" style={{ ...vars, x: trackX }}>
            {stops.map((stop, index) => (
              <StopColumn
                key={`${stop.year}-${stop.company}`}
                stop={stop}
                x={geometry.stopX(index)}
                active={index === activeIndex}
                shown={index > 0 || played}
              />
            ))}
          </motion.ol>
          <motion.div className="absolute inset-y-0 left-0" style={{ ...vars, x: trackX }}>
            {milestones.map((milestone) => (
              <MilestoneStrip
                key={`${milestone.date}-${milestone.label}`}
                milestone={milestone}
                kindLabel={milestoneKinds[milestone.kind]}
                x={geometry.gapX(milestone.afterStop)}
              />
            ))}
          </motion.div>
        </div>

        <div className="pointer-events-none absolute left-14 top-[88px] w-[min(26rem,34vw)] lg:left-16 [&_h2]:text-[clamp(1.75rem,3vw,3rem)]">
          <SectionHeader index="02" label={timeline.label} heading={timeline.heading} intro={timeline.intro} />
        </div>

        <YearReadout
          year={activeStop?.year ?? ""}
          period={activeStop?.period ?? ""}
          eraFraction={eraFraction}
          inkScale={inkScale}
          orangeScale={orangeScale}
        />
      </div>
    </div>
  );
}
