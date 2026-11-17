import type { ReactNode } from "react";

/** Every drawing shares this viewBox, so all six frames line up and scale together. */
export const DRAWING_WIDTH = 320;
export const DRAWING_HEIGHT = 180;

/** A box on the sheet: paper fill, ink hairline. */
export const BOX = "fill-paper stroke-ink";
/** A secondary line. */
export const SECONDARY = "stroke-line-strong";
/** A small uppercase label. */
export const TEXT = "font-label font-medium fill-ink";

/** The common SVG shell of a drawing: fixed viewBox, hairline strokes, round caps, no fill by default. */
export function DrawingSvg({ children }: Readonly<{ children: ReactNode }>): ReactNode {
  return (
    <svg
      viewBox={`0 0 ${DRAWING_WIDTH} ${DRAWING_HEIGHT}`}
      className="block size-full"
      fill="none"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
    >
      {children}
    </svg>
  );
}
