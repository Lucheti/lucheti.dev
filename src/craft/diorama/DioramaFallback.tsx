import type { ReactNode } from "react";
import { assertNever } from "../layers/assertNever";
import type { ScreenBounds } from "../layers/IsometricView";
import type { DioramaSketch, FaceSide } from "./DioramaSketch";
import { INK, LIGHT, shade, TOON } from "./toon";

/** How much darker each side of a box is drawn than its top, as if lit from above and the front right. */
function shadeOf(side: FaceSide): number {
  switch (side) {
    case "top":
      return 1;
    case "left":
      return 0.9;
    case "right":
      return 0.78;
    default:
      return assertNever(side);
  }
}

/**
 * The island as a flat drawing, for before WebGL is ready or when it never is: the same boxes as the model,
 * back to front, in the same toy paints with warm ink edges, over a soft tinted shadow. It is framed by the
 * camera's own frame, so the model lands exactly where the drawing was. Decorative.
 */
export function DioramaFallback({ sketch, frame, margin, className }: Readonly<{ sketch: DioramaSketch; frame: ScreenBounds; margin: number; className?: string }>): ReactNode {
  const width = frame.maxX - frame.minX;
  const height = frame.maxY - frame.minY;
  const span = Math.max(width, height) / (1 - 2 * margin);
  const centreX = (frame.minX + frame.maxX) / 2;
  const centreY = -(frame.minY + frame.maxY) / 2;
  const viewBox = `${centreX - span / 2} ${centreY - span / 2} ${span} ${span}`;
  return (
    <svg aria-hidden viewBox={viewBox} preserveAspectRatio="xMidYMid meet" className={className}>
      <defs>
        <filter id="diorama-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={width * 0.02} />
        </filter>
      </defs>
      <polygon
        points={sketch
          .footprint()
          .map((p) => `${p.x.toFixed(4)},${(-p.y + height * 0.02).toFixed(4)}`)
          .join(" ")}
        fill={LIGHT.shadow}
        opacity={0.28}
        filter="url(#diorama-shadow)"
      />
      {sketch.faces().map((face, index) => (
        <polygon
          key={index}
          points={face.points.map((p) => `${p.x.toFixed(4)},${(-p.y).toFixed(4)}`).join(" ")}
          fill={shade(TOON[face.tone].color, shadeOf(face.side))}
          stroke={INK}
          strokeOpacity={0.55}
          strokeWidth={1.2}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
