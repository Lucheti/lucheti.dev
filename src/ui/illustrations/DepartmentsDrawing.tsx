import type { ReactNode } from "react";
import { BOX, DrawingSvg, SECONDARY, TEXT } from "./DrawingSvg";
import { PathTraveller, type DrawingPoint } from "./PathTraveller";

const CARD_WIDTH = 88;
const CARD_HEIGHT = 60;
const GAP = 12;
const LEFT = 16;
const TOP = 24;
const PACKET_PATH = "M40 55 H160";
/** Halfway along the packet's path. */
const PACKET_REST: DrawingPoint = { x: 100, y: 55 };

type Department = Readonly<{ name: string; workers: number; busy: number }>;

/** Row one runs left to right, row two right to left, so the lifecycle snakes down the sheet. */
const ROWS: readonly (readonly Department[])[] = [
  [
    { name: "PRODUCT", workers: 3, busy: 2 },
    { name: "DESIGN", workers: 2, busy: 1 },
    { name: "ENGINEERING", workers: 3, busy: 3 },
  ],
  [
    { name: "RELEASE", workers: 2, busy: 0 },
    { name: "DOCS", workers: 2, busy: 1 },
    { name: "QA", workers: 2, busy: 2 },
  ],
];

function DepartmentCard({ department, x, y }: Readonly<{ department: Department; x: number; y: number }>): ReactNode {
  return (
    <>
      <rect x={x} y={y} width={CARD_WIDTH} height={CARD_HEIGHT} rx={5} className={BOX} />
      <text x={x + 10} y={y + 17} fontSize={9} letterSpacing="0.02em" className={TEXT}>
        {department.name}
      </text>
      <line x1={x + 10} y1={y + 25} x2={x + CARD_WIDTH - 10} y2={y + 25} className={SECONDARY} />
      {Array.from({ length: department.workers }, (_, index) => (
        <circle
          key={index}
          cx={x + 16 + index * 12}
          cy={y + 44}
          r={3.5}
          className={index < department.busy ? "fill-ink stroke-ink" : "fill-paper stroke-line-strong"}
        />
      ))}
    </>
  );
}

/** Six department cards with their workers, and an orange ticket passing from Product to Design. */
export function DepartmentsDrawing(): ReactNode {
  return (
    <DrawingSvg>
      {/* Hand-offs in the gutters */}
      <g className={SECONDARY}>
        <line x1={104} y1={54} x2={116} y2={54} />
        <line x1={208} y1={54} x2={220} y2={54} />
        <line x1={260} y1={84} x2={260} y2={96} />
        <line x1={104} y1={126} x2={116} y2={126} />
        <line x1={208} y1={126} x2={220} y2={126} />
      </g>

      {ROWS.map((row, rowIndex) =>
        row.map((department, columnIndex) => (
          <DepartmentCard
            key={department.name}
            department={department}
            x={LEFT + columnIndex * (CARD_WIDTH + GAP)}
            y={TOP + rowIndex * (CARD_HEIGHT + GAP)}
          />
        )),
      )}

      <PathTraveller path={PACKET_PATH} seconds={2.6} rest={PACKET_REST} easing="ease-in-out">
        <rect x={-7} y={-4} width={14} height={8} rx={2} className="fill-signal stroke-ink" />
      </PathTraveller>
    </DrawingSvg>
  );
}
