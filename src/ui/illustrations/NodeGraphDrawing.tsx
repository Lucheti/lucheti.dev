import type { ReactNode } from "react";
import { BOX, DrawingSvg, SECONDARY, TEXT } from "./DrawingSvg";

const EXPORT_EDGE = "M224 114 C236 114 235 90 247 90";

type NodeProps = Readonly<{ x: number; y: number; h: number; label: string }>;

const NODE_WIDTH = 54;

function Node({ x, y, h, label }: NodeProps): ReactNode {
  return (
    <>
      <rect x={x} y={y} width={NODE_WIDTH} height={h} rx={5} className={BOX} />
      <text x={x + 8} y={y + 14} fontSize={9} letterSpacing="0.04em" className={TEXT}>
        {label}
      </text>
    </>
  );
}

function Port({ x, y, hot = false }: Readonly<{ x: number; y: number; hot?: boolean }>): ReactNode {
  return <circle cx={x} cy={y} r={3} className={hot ? "fill-signal stroke-ink" : "fill-paper stroke-ink"} />;
}

/** A node-based editor: four nodes, bezier edges, and a dot travelling the edge into Export. */
export function NodeGraphDrawing(): ReactNode {
  return (
    <DrawingSvg>
      <g className="stroke-ink" strokeWidth={1.25}>
        <path d="M70 90 C82 90 81 66 93 66" />
        <path d="M147 66 C159 66 158 114 170 114" />
      </g>
      <path d={EXPORT_EDGE} className="stroke-signal" strokeWidth={1.5} />

      {/* Clip: label and a filmstrip thumbnail */}
      <Node x={16} y={62} h={56} label="CLIP" />
      <rect x={24} y={80} width={38} height={28} rx={2} className="fill-paper-sunk stroke-line-strong" />
      <g className="fill-paper stroke-ink">
        <rect x={27} y={85} width={9} height={18} rx={1} />
        <rect x={39} y={85} width={9} height={18} rx={1} />
        <rect x={51} y={85} width={9} height={18} rx={1} />
      </g>

      {/* Trim: a range slider with two handles */}
      <Node x={93} y={46} h={40} label="TRIM" />
      <line x1={101} y1={72} x2={139} y2={72} className={SECONDARY} />
      <line x1={108} y1={72} x2={131} y2={72} className="stroke-ink" strokeWidth={1.5} />
      <circle cx={108} cy={72} r={2.5} className="fill-paper stroke-ink" />
      <circle cx={131} cy={72} r={2.5} className="fill-paper stroke-ink" />

      {/* Blur: a single slider */}
      <Node x={170} y={94} h={40} label="BLUR" />
      <line x1={178} y1={120} x2={216} y2={120} className={SECONDARY} />
      <line x1={178} y1={120} x2={198} y2={120} className="stroke-ink" strokeWidth={1.5} />
      <circle cx={198} cy={120} r={2.5} className="fill-paper stroke-ink" />

      {/* Export: a download mark */}
      <Node x={247} y={70} h={40} label="EXPORT" />
      <path d="M268 83 v10 m-4 -4 l4 4 l4 -4 M262 99 h12" className="stroke-ink" />

      <Port x={70} y={90} />
      <Port x={93} y={66} />
      <Port x={147} y={66} />
      <Port x={170} y={114} />
      <Port x={224} y={114} />
      <Port x={247} y={90} hot />

      <circle
        cx={0}
        cy={0}
        r={3}
        className="fill-signal motion-safe:animate-[repo-travel_2.4s_ease-in-out_infinite]"
        style={{ offsetPath: `path('${EXPORT_EDGE}')`, offsetRotate: "0deg", offsetDistance: "50%" }}
      />
    </DrawingSvg>
  );
}
