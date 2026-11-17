import type { CSSProperties, ReactNode } from "react";
import { cx } from "../cx";
import { PathTraveller } from "../illustrations/PathTraveller";
import { cubicPath, pointOnCubic, strandField, type Cubic } from "./MotifGeometry";
import { INK_CLASS, INK_OPACITY, SIGNAL_OPACITY } from "./MotifInk";

const WIDTH = 800;
const HEIGHT = 640;
const STRAND_COUNT = 21;
/** Where along a strand its node sits, at the waist of the field. */
const NODE_AT = 0.55;
/** Every how many strands one carries a node. */
const NODE_EVERY = 4;

/** One swaying sheet of strands: its own SVG, so the sway is a composited transform. */
type Layer = Readonly<{ sway: string; head: number }>;

const LAYERS: readonly Layer[] = [
  { sway: "motion-safe:animate-[backdrop-sway_21s_ease-in-out_infinite_alternate]", head: 4 },
  { sway: "motion-safe:animate-[backdrop-sway_27s_ease-in-out_infinite_alternate-reverse]", head: 9 },
  { sway: "motion-safe:animate-[backdrop-sway_33s_ease-in-out_infinite_alternate]", head: 15 },
];

/** A strand that carries a pulse, and the pulse's pace. */
type Pulse = Readonly<{ strand: number; seconds: number; head: number }>;

const PULSES: readonly Pulse[] = [
  { strand: 6, seconds: 7, head: 1.5 },
  { strand: 14, seconds: 9.5, head: 5 },
];

/** The comet behind each pulse: radius and strength of each dot, head first. */
const COMET: readonly Readonly<{ r: number; opacity: number }>[] = [
  { r: 3.4, opacity: 1 },
  { r: 2.6, opacity: 0.6 },
  { r: 2, opacity: 0.38 },
  { r: 1.5, opacity: 0.22 },
];
/** Seconds between one comet dot and the next. */
const COMET_LAG = 0.11;

function Comet({ strand, pulse }: Readonly<{ strand: Cubic; pulse: Pulse }>): ReactNode {
  const path = cubicPath(strand);
  return (
    <g className="fill-signal">
      {COMET.map((dot, index) => (
        <PathTraveller
          key={dot.r}
          path={path}
          seconds={pulse.seconds}
          head={pulse.head - index * COMET_LAG}
          rest={pointOnCubic(strand, 0.7 - index * 0.012)}
        >
          <circle r={dot.r} opacity={dot.opacity} />
        </PathTraveller>
      ))}
    </g>
  );
}

/** AI: flowing bezier strands like a neural field, with an orange pulse running along two of them. */
export function AiMotif(): ReactNode {
  const strands = strandField(STRAND_COUNT, WIDTH, HEIGHT);
  return (
    <div className="relative aspect-[5/4] w-full">
      {LAYERS.map((layer, layerIndex) => {
        const style: CSSProperties = { animationDelay: `${-layer.head}s` };
        const mine = strands.map((strand, index) => ({ strand, index })).filter(({ index }) => index % LAYERS.length === layerIndex);
        const pulses = PULSES.filter((pulse) => pulse.strand % LAYERS.length === layerIndex);
        return (
          <svg
            key={layer.sway}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className={cx("absolute inset-0 size-full overflow-visible", layer.sway)}
            style={style}
            fill="none"
            strokeLinecap="round"
            focusable="false"
          >
            <g className={INK_CLASS} opacity={INK_OPACITY}>
              <g stroke="currentColor">
                {mine.map(({ strand, index }) => (
                  <path key={index} d={cubicPath(strand)} />
                ))}
              </g>
              <g fill="currentColor">
                {mine
                  .filter(({ index }) => index % NODE_EVERY === 0)
                  .map(({ strand, index }) => {
                    const node = pointOnCubic(strand, NODE_AT);
                    return <circle key={index} cx={node.x} cy={node.y} r={3} />;
                  })}
              </g>
            </g>
            {pulses.map((pulse) => {
              const strand = strands[pulse.strand];
              return (
                <g key={pulse.strand}>
                  <path
                    d={cubicPath(strand)}
                    className="stroke-signal"
                    strokeWidth={1.25}
                    opacity={SIGNAL_OPACITY * 0.6}
                  />
                  <Comet strand={strand} pulse={pulse} />
                </g>
              );
            })}
          </svg>
        );
      })}
    </div>
  );
}
