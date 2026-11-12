"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import type { FrameSequence } from "@/content";
import type { Progress, Signal } from "@/story";
import { FrameSequenceController } from "./FrameSequenceController";
import { BrowserImageSource } from "./BrowserImageSource";

type FrameSequencePlayerProps = Readonly<{
  sequence: FrameSequence;
  /** Where in the sequence to be; scrubbed with inertia unless motion is reduced. */
  progress: Signal<Progress>;
  className?: string;
  /** Part of the frame kept in view when it is cropped to fill the parent. */
  focalX?: number;
  focalY?: number;
}>;

const DEFAULT_FOCAL = 0.5;

/** A canvas that fills its positioned parent and paints the frame the signal points at. */
export function FrameSequencePlayer({
  sequence,
  progress,
  className,
  focalX = DEFAULT_FOCAL,
  focalY = DEFAULT_FOCAL,
}: FrameSequencePlayerProps): ReactNode {
  const reducedMotion = useReducedMotion() === true;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) {
      return undefined;
    }
    const controller = new FrameSequenceController({
      canvas,
      progress,
      sequence,
      source: new BrowserImageSource(),
      scrubbing: !reducedMotion,
      focal: { x: focalX, y: focalY },
    });
    controller.start();
    return () => controller.dispose();
  }, [progress, sequence, reducedMotion, focalX, focalY]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className ?? ""}`}
    />
  );
}
