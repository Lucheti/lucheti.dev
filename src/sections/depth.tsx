"use client";

import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import { useEffect, type ReactNode } from "react";

const FINE_POINTER = "(pointer: fine)";
const SPRING = { stiffness: 90, damping: 22, mass: 0.7 } as const;

export type Pointer = Readonly<{ x: MotionValue<number>; y: MotionValue<number> }>;

/** Normalised pointer position (-1 … 1), damped by a spring. Idle for touch and reduced motion. */
export function usePointerDepth(enabled: boolean): Pointer {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING);
  const y = useSpring(rawY, SPRING);

  useEffect(() => {
    if (!enabled || !window.matchMedia(FINE_POINTER).matches) {
      return undefined;
    }
    const onMove = (event: PointerEvent): void => {
      rawX.set((event.clientX / window.innerWidth) * 2 - 1);
      rawY.set((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled, rawX, rawY]);

  return { x, y };
}

type PointerLayerProps = Readonly<{
  pointer: Pointer;
  /** Travel in px at the screen edge; the sign sets the direction. */
  travel: number;
  className?: string;
  children: ReactNode;
}>;

/** Shifts its children with the pointer, so stacked layers separate in depth. */
export function PointerLayer({ pointer, travel, className, children }: PointerLayerProps): ReactNode {
  const x = useTransform(pointer.x, (value) => value * travel);
  const y = useTransform(pointer.y, (value) => value * travel);
  return (
    <motion.div className={className} style={{ x, y }}>
      {children}
    </motion.div>
  );
}

type DepthLayerProps = Readonly<{
  /** Scroll-driven vertical travel, as a percentage of the layer's own height. */
  y: MotionValue<string>;
  pointer: Pointer;
  travel: number;
  className?: string;
  children: ReactNode;
}>;

/** Two nested transform layers: scroll on the outside, pointer on the inside. */
export function DepthLayer({ y, pointer, travel, className, children }: DepthLayerProps): ReactNode {
  return (
    <motion.div className={className} style={{ y }}>
      <PointerLayer pointer={pointer} travel={travel} className="size-full">
        {children}
      </PointerLayer>
    </motion.div>
  );
}
