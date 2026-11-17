import type { ReactNode } from "react";
import { BOX, DrawingSvg, SECONDARY, TEXT } from "./DrawingSvg";

const SERVICE_WIDTH = 80;
const SERVICE_HEIGHT = 26;

function Service({ x, y, label }: Readonly<{ x: number; y: number; label: string }>): ReactNode {
  return (
    <>
      <rect x={x} y={y} width={SERVICE_WIDTH} height={SERVICE_HEIGHT} rx={5} className={BOX} />
      <text
        x={x + SERVICE_WIDTH / 2}
        y={y + SERVICE_HEIGHT / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={9}
        letterSpacing="0.04em"
        className={TEXT}
      >
        {label}
      </text>
    </>
  );
}

/** An orchestrator hub with four services; Inventory fails and a dashed arrow compensates Payments. */
export function SagaDrawing(): ReactNode {
  return (
    <DrawingSvg>
      <g className={SECONDARY}>
        <line x1={56} y1={48} x2={139.6} y2={81.8} />
        <line x1={264} y1={48} x2={180.4} y2={81.8} />
        <line x1={56} y1={132} x2={139.6} y2={98.2} />
        <line x1={264} y1={132} x2={180.4} y2={98.2} />
      </g>

      <circle cx={160} cy={90} r={22} className={BOX} strokeWidth={1.25} />
      <circle cx={160} cy={90} r={9} className="stroke-line-strong" />
      <circle cx={160} cy={90} r={2.5} className="fill-ink" />
      <text x={160} y={125} textAnchor="middle" fontSize={9} letterSpacing="0.06em" className={TEXT}>
        ORCHESTRATOR
      </text>

      <Service x={16} y={22} label="ORDERS" />
      <Service x={224} y={22} label="PAYMENTS" />
      <Service x={224} y={132} label="INVENTORY" />
      <Service x={16} y={132} label="SHIPPING" />

      {/* The failure: a badge on Inventory */}
      <circle cx={224} cy={132} r={7} className="fill-paper stroke-signal" strokeWidth={1.25} />
      <path d="M221 129 L227 135 M227 129 L221 135" className="stroke-signal" strokeWidth={1.5} />

      {/* The compensation: back to Payments */}
      <path
        d="M292 132 C308 112 308 68 292 48"
        className="stroke-signal motion-safe:animate-[repo-dash_1.2s_linear_infinite]"
        strokeWidth={1.25}
        strokeDasharray="4 4"
      />
      <path d="M293.1 54.9 L292 48 L298.5 50.5" className="stroke-signal" strokeWidth={1.25} />
    </DrawingSvg>
  );
}
