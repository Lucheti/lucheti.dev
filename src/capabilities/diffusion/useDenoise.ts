"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { DiffusionSchedule } from "./DiffusionSchedule";
import { NoiseLayer } from "./NoiseLayer";

/** How soft the picture is at the start of a run, in px of blur. */
const MAX_BLUR_PX = 7;
/** The grain re-rolls this often, in ms, so it shimmers like a television instead of freezing. */
const GRAIN_INTERVAL_MS = 90;
/** A long pause (a background tab) never skips more than this much of a run. */
const MAX_FRAME_MS = 64;

type DenoiseOptions = Readonly<{
  schedule: DiffusionSchedule;
  /** Whether the panel is on screen and motion is welcome; the run waits while this is false. */
  active: boolean;
  /** Called once when a run resolves on its own (not when it is stopped early). */
  onDone?: () => void;
}>;

type Denoise = Readonly<{
  /** Goes on the canvas that carries the grain. */
  grainRef: RefObject<HTMLCanvasElement | null>;
  /** Goes on the box around the picture, which is softened while it denoises. */
  frameRef: RefObject<HTMLDivElement | null>;
  /** Whether a run is in progress. */
  running: boolean;
  /** The visible step, 0 to the schedule's step count. */
  step: number;
  /** Starts a run from pure noise. */
  start: () => void;
  /** Ends a run at once, leaving the picture clean. */
  stop: () => void;
}>;

/**
 * Drives a denoising run. Per frame it only writes the grain's opacity and the picture's blur straight to
 * the DOM, so React re-renders once per step rather than 60 times a second. It stops when the panel is off
 * screen and picks up where it left off when it returns.
 */
export function useDenoise({ schedule, active, onDone }: DenoiseOptions): Denoise {
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);
  const grain = useRef<HTMLCanvasElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(schedule.stepCount());
  const elapsed = useRef(0);
  const layer = useRef<NoiseLayer | null>(null);

  const apply = useCallback(
    (noise: number): void => {
      const canvas = grain.current;
      const box = frame.current;
      if (canvas !== null) {
        canvas.style.opacity = noise > 0.002 ? noise.toFixed(3) : "0";
      }
      if (box !== null) {
        const blur = schedule.softnessAt(noise, MAX_BLUR_PX);
        box.style.filter = noise > 0.002 ? `blur(${blur.toFixed(2)}px) saturate(${(1 - noise * 0.7).toFixed(2)})` : "";
      }
    },
    [grain, frame, schedule],
  );

  const paintGrain = useCallback((): void => {
    const canvas = grain.current;
    if (canvas === null) {
      return;
    }
    layer.current ??= new NoiseLayer(canvas);
    layer.current.paint();
  }, [grain]);

  const start = useCallback((): void => {
    elapsed.current = 0;
    // Cover the picture before React swaps it, so the finished image never flashes.
    paintGrain();
    apply(1);
    setStep(0);
    setRunning(true);
  }, [apply, paintGrain]);

  const stop = useCallback((): void => {
    apply(0);
    setStep(schedule.stepCount());
    setRunning(false);
  }, [apply, schedule]);

  useEffect(() => {
    if (!running || !active) {
      return undefined;
    }
    let frameId = 0;
    let last = performance.now();
    let sinceGrain = 0;
    const tick = (now: number): void => {
      const delta = Math.min(MAX_FRAME_MS, now - last);
      last = now;
      elapsed.current += delta;
      sinceGrain += delta;
      const progress = schedule.progressAt(elapsed.current);
      if (progress >= 1) {
        apply(0);
        setStep(schedule.stepCount());
        setRunning(false);
        done.current?.();
        return;
      }
      if (sinceGrain >= GRAIN_INTERVAL_MS) {
        sinceGrain = 0;
        paintGrain();
      }
      apply(schedule.noiseAt(progress));
      setStep(schedule.stepAt(progress));
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [running, active, schedule, apply, paintGrain]);

  return { grainRef: grain, frameRef: frame, running, step, start, stop };
}
