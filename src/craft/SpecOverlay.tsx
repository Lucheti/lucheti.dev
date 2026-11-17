"use client";

import { motion, type TargetAndTransition } from "motion/react";
import { useMemo, type ReactNode } from "react";
import type { SpecNote } from "@/content";
import { EASE_OUT_EXPO } from "@/ui";
import { CubicBezier } from "./CubicBezier";
import type { Annotation, SpecLayout } from "./SpecAnnotator";

const DRAW_SECONDS = 0.6;
const STAGGER_SECONDS = 0.06;
const LABEL_LAG_SECONDS = 0.45;
const PLOT = { width: 72, height: 30, inset: 3 } as const;
const PLOT_SAMPLES = 24;
const MOTION_SECONDS = 0.32;

type SpecOverlayProps = Readonly<{
  layout: SpecLayout;
  notes: readonly SpecNote[];
  on: boolean;
  /** Increments each time the specimen's switch is toggled; replays the dot on the curve. */
  pulse: number;
}>;

function arriving(index: number, on: boolean, lag = 0): TargetAndTransition {
  return {
    opacity: on ? 1 : 0,
    transition: on
      ? { duration: 0.4, delay: index * STAGGER_SECONDS + lag, ease: EASE_OUT_EXPO }
      : { duration: 0.2 },
  };
}

function drawing(index: number, on: boolean): TargetAndTransition {
  return {
    pathLength: on ? 1 : 0,
    opacity: on ? 1 : 0,
    transition: on
      ? { duration: DRAW_SECONDS, delay: index * STAGGER_SECONDS, ease: EASE_OUT_EXPO }
      : { duration: 0.2 },
  };
}

/** The easing curve of the switch, plotted small, with a dot that runs along it on every toggle. */
function EasingPlot({ pulse }: { readonly pulse: number }): ReactNode {
  const points = useMemo(
    () =>
      new CubicBezier(...EASE_OUT_EXPO).sample(PLOT_SAMPLES).map((point) => ({
        x: PLOT.inset + point.x * (PLOT.width - PLOT.inset * 2),
        y: PLOT.height - PLOT.inset - point.y * (PLOT.height - PLOT.inset * 2),
      })),
    [],
  );
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join("");

  return (
    <svg aria-hidden viewBox={`0 0 ${PLOT.width} ${PLOT.height}`} width={PLOT.width} height={PLOT.height} className="overflow-visible">
      <path
        d={`M${PLOT.inset} ${PLOT.inset}V${PLOT.height - PLOT.inset}H${PLOT.width - PLOT.inset}`}
        fill="none"
        className="stroke-line-strong"
        strokeWidth="1"
      />
      <path d={path} fill="none" className="stroke-signal" strokeWidth="1.25" />
      <motion.circle
        key={pulse}
        r="2.5"
        className="fill-signal"
        initial={{ cx: points[0].x, cy: points[0].y }}
        animate={{ cx: points.map((point) => point.x), cy: points.map((point) => point.y) }}
        transition={{ duration: MOTION_SECONDS, ease: "linear" }}
      />
    </svg>
  );
}

type TagProps = Readonly<{
  annotation: Annotation;
  note: SpecNote;
  index: number;
  on: boolean;
  pulse: number;
}>;

function Tag({ annotation, note, index, on, pulse }: TagProps): ReactNode {
  const { tag } = annotation;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={arriving(index, on, LABEL_LAG_SECONDS)}
      className="absolute flex flex-col gap-1 border border-signal bg-paper-raised px-2 py-1.5 font-label"
      style={{
        left: tag.x,
        top: tag.y,
        width: tag.width,
        transform: `translate(${tag.side === "left" ? "-100%" : "0"}, -50%)`,
      }}
    >
      <span className="text-[10px] uppercase leading-none tracking-[0.14em] text-signal-ink">{note.label}</span>
      <span className="text-[11px] leading-[1.35] text-ink">{note.value}</span>
      {annotation.id === "motion" && <EasingPlot pulse={pulse} />}
    </motion.div>
  );
}

/** Redlines over the specimen. Geometry arrives ready-made; this only draws it. */
export function SpecOverlay({ layout, notes, on, pulse }: SpecOverlayProps): ReactNode {
  const tags = layout.mode === "tags";
  const noteFor = (annotation: Annotation): SpecNote | undefined => notes.find((note) => note.id === annotation.id);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <svg className="absolute inset-0 size-full overflow-visible">
        {layout.annotations.map((annotation, index) => (
          <g key={annotation.id}>
            {annotation.shapes.map((shape) =>
              shape.dashed ? (
                <motion.path
                  key={shape.d}
                  d={shape.d}
                  fill="none"
                  className="stroke-signal"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  initial={{ opacity: 0 }}
                  animate={arriving(index, on)}
                />
              ) : (
                <motion.path
                  key={shape.d}
                  d={shape.d}
                  fill="none"
                  className="stroke-signal"
                  strokeWidth="1"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={drawing(index, on)}
                />
              ),
            )}
            {tags && (
              <motion.path
                d={annotation.leader}
                fill="none"
                className="stroke-signal"
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={drawing(index, on)}
              />
            )}
            <motion.g initial={{ opacity: 0 }} animate={arriving(index, on, 0.2)}>
              {tags ? (
                <circle cx={annotation.anchor.x} cy={annotation.anchor.y} r="2.5" className="fill-signal" />
              ) : (
                <>
                  <circle cx={annotation.anchor.x} cy={annotation.anchor.y} r="8" className="fill-signal" />
                  <text
                    x={annotation.anchor.x}
                    y={annotation.anchor.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-ink font-label text-[10px] font-medium"
                  >
                    {annotation.number}
                  </text>
                </>
              )}
            </motion.g>
          </g>
        ))}
      </svg>

      {tags &&
        layout.annotations.map((annotation, index) => {
          const note = noteFor(annotation);
          return note ? <Tag key={annotation.id} annotation={annotation} note={note} index={index} on={on} pulse={pulse} /> : null;
        })}
    </div>
  );
}
