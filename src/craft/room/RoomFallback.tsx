import type { ReactNode } from "react";
import { assertNever } from "../layers/assertNever";
import { CLAY, shade } from "./clay";
import type { FaceSide, RoomSketch } from "./RoomSketch";

/** How much darker each side of a block is drawn than its top, as if lit from above and the front left. */
function shadeOf(side: FaceSide): number {
  switch (side) {
    case "top":
      return 1;
    case "left":
      return 0.93;
    case "right":
      return 0.85;
    default:
      return assertNever(side);
  }
}

/** Room round the drawing, as a share of its size. */
const MARGIN = 0.04;

/**
 * The room as a flat isometric drawing, for before WebGL is ready or when it never is: the same blocks as the
 * model, back to front, in the same clay colours, with hairline edges. Decorative.
 */
export function RoomFallback({ sketch, className }: Readonly<{ sketch: RoomSketch; className?: string }>): ReactNode {
  const { minX, maxX, minY, maxY } = sketch.bounds();
  const width = maxX - minX;
  const height = maxY - minY;
  const pad = Math.max(width, height) * MARGIN;
  const viewBox = `${minX - pad} ${-maxY - pad} ${width + 2 * pad} ${height + 2 * pad}`;
  return (
    <svg aria-hidden viewBox={viewBox} preserveAspectRatio="xMidYMid meet" className={className}>
      {sketch.faces().map((face, index) => (
        <polygon
          key={index}
          points={face.points.map((p) => `${p.x.toFixed(4)},${(-p.y).toFixed(4)}`).join(" ")}
          fill={shade(CLAY[face.tone].color, shadeOf(face.side))}
          stroke="rgb(14 14 14 / 0.14)"
          strokeWidth={1}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
