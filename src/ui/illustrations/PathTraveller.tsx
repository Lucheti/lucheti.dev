"use client";

import { useReducedMotion } from "motion/react";
import { useSyncExternalStore, type ReactNode, type SVGProps } from "react";

/** A point in a drawing's own coordinates. */
export type DrawingPoint = Readonly<{ x: number; y: number }>;

/** How a traveller paces each run along its path. */
export type TravelEasing = "linear" | "ease-in-out";

type PathTravellerProps = Readonly<{
  /** The SVG path to follow, in the drawing's coordinates. */
  path: string;
  /** Seconds per run; each run starts again from the beginning. */
  seconds: number;
  /** Where the shape rests when motion is reduced, and before the page hydrates. */
  rest: DrawingPoint;
  /** Seconds already elapsed at the start, so parallel travellers do not move in step. */
  head?: number;
  easing?: TravelEasing;
  /** Fades the shape in as each run starts and out as it ends. */
  fade?: boolean;
  /** The shape, drawn around 0,0. */
  children: ReactNode;
}>;

const EASE_IN_OUT_SPLINE = "0.42 0 0.58 1";
const FADE_VALUES = "0;1;1;0";
const FADE_TIMES = "0;0.12;0.88;1";

function noSubscription(): () => void {
  return () => undefined;
}

/** False on the server and while hydrating, true afterwards; keeps the first client render equal to the server's. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
}

type MotionTiming = Readonly<Pick<SVGProps<SVGElement>, "calcMode" | "keyPoints" | "keyTimes" | "keySplines">>;

function timingOf(easing: TravelEasing): MotionTiming {
  switch (easing) {
    case "linear":
      return { calcMode: "linear" };
    case "ease-in-out":
      return { calcMode: "spline", keyPoints: "0;1", keyTimes: "0;1", keySplines: EASE_IN_OUT_SPLINE };
    default:
      return assertNever(easing);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled easing: ${String(value)}`);
}

/**
 * Moves a shape along an SVG path with `<animateMotion>`. CSS `offset-path` does not move SVG
 * elements in Chrome, so drawings use this instead. Static at `rest` under reduced motion.
 */
export function PathTraveller({
  path,
  seconds,
  rest,
  head = 0,
  easing = "linear",
  fade = false,
  children,
}: PathTravellerProps): ReactNode {
  const hydrated = useHydrated();
  const reduced = useReducedMotion() === true;

  if (!hydrated || reduced) {
    return <g transform={`translate(${rest.x} ${rest.y})`}>{children}</g>;
  }

  const duration = `${seconds}s`;
  const begin = `${-head}s`;
  return (
    <g>
      {children}
      <animateMotion path={path} dur={duration} begin={begin} repeatCount="indefinite" {...timingOf(easing)} />
      {fade ? (
        <animate
          attributeName="opacity"
          values={FADE_VALUES}
          keyTimes={FADE_TIMES}
          dur={duration}
          begin={begin}
          repeatCount="indefinite"
        />
      ) : null}
    </g>
  );
}
