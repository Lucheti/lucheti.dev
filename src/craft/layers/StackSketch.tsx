import { useId, type ReactNode } from "react";
import { assertNever } from "./assertNever";
import type { SketchShape } from "./FallbackSketch";
import type { StageSize } from "./StageFit";

type StackSketchProps = Readonly<{
  shapes: readonly SketchShape[];
  size: StageSize;
  className?: string;
}>;

/** The flat SVG drawing of the exploded stack, in stage pixels: the fallback for when WebGL is not (yet) there. */
export function StackSketch({ shapes, size, className }: StackSketchProps): ReactNode {
  // An id that is safe inside url(#…), whatever characters React's ids carry.
  const blurId = `stack-shadow-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg aria-hidden viewBox={`0 0 ${size.width} ${size.height}`} className={className} shapeRendering="geometricPrecision">
      {shapes.map((shape, index) => {
        switch (shape.kind) {
          case "area":
            return (
              <path
                key={index}
                d={shape.d}
                fill={shape.color}
                fillOpacity={shape.opacity}
                fillRule={shape.evenOdd ? "evenodd" : "nonzero"}
              />
            );
          case "line":
            return (
              <path
                key={index}
                d={shape.d}
                fill="none"
                stroke={shape.color}
                strokeOpacity={shape.opacity}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                strokeLinejoin="round"
              />
            );
          case "shadow":
            return (
              <g key={index}>
                <filter id={blurId} x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation={shape.blur} />
                </filter>
                <path d={shape.d} fill={shape.color} fillOpacity={shape.opacity} filter={`url(#${blurId})`} />
              </g>
            );
          default:
            return assertNever(shape);
        }
      })}
    </svg>
  );
}
