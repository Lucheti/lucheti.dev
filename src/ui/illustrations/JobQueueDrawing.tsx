import type { ReactNode } from "react";
import { BOX, DrawingSvg, SECONDARY } from "./DrawingSvg";

const SLOT_Y = [56, 74, 92, 110] as const;
const WORKER_CENTRES = [54, 90, 126] as const;

const CAPTION = "font-label font-medium fill-mute";

function Worker({ cy, fill, hot = false }: Readonly<{ cy: number; fill: number; hot?: boolean }>): ReactNode {
  const barWidth = 34;
  return (
    <>
      <rect x={168} y={cy - 13} width={64} height={26} rx={5} className={BOX} />
      <rect x={176} y={cy - 4} width={8} height={8} rx={1.5} className={hot ? "stroke-signal" : "stroke-ink"} />
      <rect x={190} y={cy - 1.5} width={barWidth} height={3} rx={1.5} className="fill-line-strong stroke-none" />
      <rect
        x={190}
        y={cy - 1.5}
        width={barWidth}
        height={3}
        rx={1.5}
        className={
          hot
            ? "fill-signal stroke-none [transform-box:fill-box] origin-left motion-safe:animate-[repo-fill_2.8s_ease-in-out_infinite_alternate]"
            : "fill-ink stroke-none [transform-box:fill-box] origin-left"
        }
        style={hot ? undefined : { transform: `scaleX(${fill})` }}
      />
    </>
  );
}

/** An upload feeds a queue, the queue fans out to three workers, and the results land in storage. */
export function JobQueueDrawing(): ReactNode {
  return (
    <DrawingSvg>
      {/* Upload */}
      <path d="M28 100 V78 M20 86 L28 78 L36 86 M18 106 H38" className="stroke-ink" strokeWidth={1.25} />
      <path d="M44 90 H56 M52 86 L56 90 L52 94" className="stroke-ink" />

      {/* Queue */}
      {SLOT_Y.map((y) => (
        <rect key={y} x={62} y={y} width={52} height={14} rx={3} className={BOX} />
      ))}
      <rect x={68} y={59} width={22} height={8} rx={2} className="fill-ink stroke-none" />
      <rect x={68} y={77} width={30} height={8} rx={2} className="fill-ink stroke-none" />
      <rect x={68} y={95} width={16} height={8} rx={2} className="fill-ink stroke-none" />

      {/* Fan out */}
      <g className="stroke-ink">
        <path d="M114 90 C140 90 140 54 168 54" />
        <path d="M114 90 H168" />
        <path d="M114 90 C140 90 140 126 168 126" />
      </g>
      <Worker cy={WORKER_CENTRES[0]} fill={1} />
      <Worker cy={WORKER_CENTRES[1]} fill={1} hot />
      <Worker cy={WORKER_CENTRES[2]} fill={0.35} />

      {/* Into storage */}
      <g className="stroke-ink">
        <path d="M232 54 C248 54 248 80 263 80" />
        <path d="M232 90 H263" />
        <path d="M232 126 C248 126 248 100 263 100" />
      </g>
      <path d="M263 72 V108 A17 5 0 0 0 297 108 V72" className={BOX} strokeWidth={1.25} />
      <ellipse cx={280} cy={72} rx={17} ry={5} className={BOX} strokeWidth={1.25} />
      <path d="M263 90 A17 5 0 0 0 297 90" className={SECONDARY} />

      <g textAnchor="middle" fontSize={9} letterSpacing="0.08em">
        <text x={88} y={156} className={CAPTION}>
          QUEUE
        </text>
        <text x={200} y={156} className={CAPTION}>
          WORKERS
        </text>
        <text x={280} y={156} className={CAPTION}>
          STORAGE
        </text>
      </g>
    </DrawingSvg>
  );
}
