"use client";

import { motion, type MotionValue } from "motion/react";
import Image from "next/image";
import { useState, type ReactNode } from "react";
import type { Hero } from "@/content";
import { EASE_OUT_EXPO } from "@/ui";
import { DepthLayer, PointerLayer, type Pointer } from "./depth";
import { PortraitFraming, type PortraitAnchors } from "./PortraitFraming";

const FIGURE_CAPTION = "FIG. 01 — PORTRAIT";
const PORTRAIT_DELAY_S = 0.15;

/** Where the head sits in `lucas.webp`. */
const ANCHORS: PortraitAnchors = { headX: 0.52, headTop: 0.08, faceY: 0.3 };
/** Image as wide as the circle, face a little above centre, shoulders running off the bottom. */
const TARGET = { widthRatio: 1, faceAt: 0.42 } as const;

/** Pointer travel in px at the screen edge: the window and the portrait inside it move apart. */
const POINTER_TRAVEL = { window: -8, portrait: 12 } as const;

const TICK = "absolute bg-ink";

/** Four short ticks on the thin ring at 12, 3, 6 and 9 o'clock. */
function RingTicks(): ReactNode {
  return (
    <>
      <span className={`${TICK} left-1/2 top-[-19px] h-2.5 w-px -translate-x-1/2`} />
      <span className={`${TICK} bottom-[-19px] left-1/2 h-2.5 w-px -translate-x-1/2`} />
      <span className={`${TICK} left-[-19px] top-1/2 h-px w-2.5 -translate-y-1/2`} />
      <span className={`${TICK} right-[-19px] top-1/2 h-px w-2.5 -translate-y-1/2`} />
    </>
  );
}

type PortraitFrameProps = Readonly<{
  portrait: Hero["portrait"];
  pointer: Pointer;
  /** Scroll-driven drift of the whole group; slower than the page. */
  y: MotionValue<string>;
  className?: string;
}>;

/**
 * The orange disc with the portrait clipped inside it, wrapped in spec-sheet rings.
 * Sized by its parent's width; everything that moves uses transforms and opacity.
 */
export function PortraitFrame({ portrait, pointer, y, className }: PortraitFrameProps): ReactNode {
  const [framing] = useState(
    () => new PortraitFraming(portrait.width / portrait.height, ANCHORS, TARGET),
  );

  return (
    <DepthLayer y={y} pointer={pointer} travel={POINTER_TRAVEL.window} className={className}>
      <div aria-hidden className="pointer-events-none absolute -inset-[14px] rounded-full border border-line-strong">
        <RingTicks />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-[30px] animate-[spin_90s_linear_infinite] rounded-full border border-dashed border-line-strong motion-reduce:animate-none"
      />
      <p
        aria-hidden
        className="absolute -bottom-[54px] right-0 whitespace-nowrap font-mono text-[11px] uppercase leading-none tracking-[0.14em] text-mute"
      >
        {FIGURE_CAPTION}
      </p>

      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-full bg-signal"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
      />
      <div className="absolute inset-0 isolate overflow-hidden rounded-full">
        <PointerLayer pointer={pointer} travel={POINTER_TRAVEL.portrait} className="absolute inset-0">
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: PORTRAIT_DELAY_S, ease: EASE_OUT_EXPO }}
          >
            <Image
              src={portrait.src}
              alt={portrait.alt}
              width={portrait.width}
              height={portrait.height}
              priority
              sizes="(min-width: 1024px) 30rem, 78vw"
              className="absolute max-w-none select-none"
              style={{
                width: `${framing.widthPercent()}%`,
                height: "auto",
                left: `${framing.leftPercent()}%`,
                top: `${framing.topPercent()}%`,
              }}
              draggable={false}
            />
          </motion.div>
        </PointerLayer>
      </div>
    </DepthLayer>
  );
}
