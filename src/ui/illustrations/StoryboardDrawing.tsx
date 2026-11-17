import type { ReactNode } from "react";
import { BOX, DrawingSvg, SECONDARY } from "./DrawingSvg";

const FRAME_WIDTH = 62;
const FRAME_HEIGHT = 35;
const FRAME_TOP = 74;
const FRAME_LEFTS = [98, 168, 238] as const;

function FrameShell({ x, label, hot = false }: Readonly<{ x: number; label: string; hot?: boolean }>): ReactNode {
  return (
    <>
      <text x={x} y={66} fontSize={9} letterSpacing="0.08em" className={hot ? "font-label font-medium fill-signal-ink" : "font-label font-medium fill-mute"}>
        {label}
      </text>
      <rect x={x} y={FRAME_TOP} width={FRAME_WIDTH} height={FRAME_HEIGHT} rx={3} className={BOX} />
    </>
  );
}

/** A prompt becomes three storyboard frames; the last is still being generated. */
export function StoryboardDrawing(): ReactNode {
  const [first, second, third] = FRAME_LEFTS;
  const barY = FRAME_TOP + FRAME_HEIGHT + 8;
  return (
    <DrawingSvg>
      {/* The brief: a chat bubble */}
      <path
        d="M24 70 H64 Q72 70 72 78 V104 Q72 112 64 112 H36 L22 120 L26 112 H24 Q16 112 16 104 V78 Q16 70 24 70 Z"
        className={BOX}
        strokeWidth={1.25}
      />
      <rect x={26} y={82} width={36} height={4} rx={2} className="fill-ink" />
      <rect x={26} y={92} width={24} height={4} rx={2} className="fill-line-strong" />
      <path d="M78 91 H92 M88 87 L92 91 L88 95" className="stroke-ink" />

      {/* Shot 01: a landscape */}
      <FrameShell x={first} label="01" />
      <circle cx={first + 44} cy={FRAME_TOP + 11} r={5} className="stroke-ink" />
      <path
        d={`M${first + 6} ${FRAME_TOP + 28} L${first + 22} ${FRAME_TOP + 16} L${first + 36} ${FRAME_TOP + 26} L${first + 44} ${FRAME_TOP + 21} L${first + 56} ${FRAME_TOP + 28}`}
        className="stroke-ink"
      />

      {/* Shot 02: a figure */}
      <FrameShell x={second} label="02" />
      <circle cx={second + 31} cy={FRAME_TOP + 13} r={4} className="stroke-ink" />
      <path d={`M${second + 21} ${FRAME_TOP + 29} Q${second + 31} ${FRAME_TOP + 15} ${second + 41} ${FRAME_TOP + 29}`} className="stroke-ink" />
      <line x1={second + 8} y1={FRAME_TOP + 29} x2={second + 54} y2={FRAME_TOP + 29} className={SECONDARY} />

      {/* Shot 03: still a sketch */}
      <FrameShell x={third} label="03" hot />
      <rect
        x={third + 14}
        y={FRAME_TOP + 9}
        width={34}
        height={17}
        rx={2}
        className={SECONDARY}
        strokeDasharray="2 3"
      />

      {/* Progress under each frame */}
      <rect x={first} y={barY} width={FRAME_WIDTH} height={3} rx={1.5} className="fill-ink stroke-none" />
      <rect x={second} y={barY} width={FRAME_WIDTH} height={3} rx={1.5} className="fill-ink stroke-none" />
      <rect x={third} y={barY} width={FRAME_WIDTH} height={3} rx={1.5} className="fill-line-strong stroke-none" />
      <rect
        x={third}
        y={barY}
        width={FRAME_WIDTH}
        height={3}
        rx={1.5}
        className="fill-signal stroke-none [transform-box:fill-box] origin-left motion-safe:animate-[repo-fill_2.8s_ease-in-out_infinite_alternate]"
        style={{ transform: "scaleX(0.55)" }}
      />
    </DrawingSvg>
  );
}
