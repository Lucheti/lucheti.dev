"use client";

import { motion, useInView, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cx } from "../cx";
import { AiMotif } from "./AiMotif";
import { BackendMotif } from "./BackendMotif";
import { FrontendMotif } from "./FrontendMotif";
import { parallaxOffset } from "./Parallax";

/** Which domain chapter a backdrop sits behind; each has its own motif. */
export type BackdropKind = "frontend" | "backend" | "ai";

/** A soft orange light: where it sits, the strength of its core (0–1), and its slow drift. */
type Glow = Readonly<{ place: string; strength: number; drift: string }>;

type Scene = Readonly<{ motif: ReactNode; glows: readonly Glow[] }>;

/** How far the motif layer travels, in px, either side of its resting place across the chapter. */
const PARALLAX_TRAVEL = 60;

/** On the backdrop: freezes every CSS loop inside it (globals.css). */
const PAUSED = "backdrop-paused";

/** Mostly to the right of the content, cropped off the edge on phones, and faded out towards its borders. */
const MOTIF_BOX = cx(
  "absolute -right-[42%] top-16 w-[170vw] opacity-60",
  "sm:-right-[18%] sm:w-[110vw] md:opacity-100",
  "lg:-right-[3%] lg:top-6 lg:w-[min(62rem,64vw)]",
);
const MOTIF_MASK = "radial-gradient(ellipse 60% 58% at 60% 45%, #000 32%, transparent 100%)";
const MOTIF_MASK_STYLE: CSSProperties = { maskImage: MOTIF_MASK, WebkitMaskImage: MOTIF_MASK };

/** A faint warm wash at the chapter's top and bottom edges. */
const TINT: CSSProperties = {
  background:
    "linear-gradient(to bottom, color-mix(in srgb, var(--color-signal) 3.5%, transparent), transparent 28%, transparent 72%, color-mix(in srgb, var(--color-signal) 3%, transparent))",
};

function percent(strength: number): string {
  return `${Math.round(strength * 1000) / 10}%`;
}

/** A radial light whose long falloff does the work of a ~120 px blur, without a filter to repaint. */
function glowStyle(strength: number): CSSProperties {
  const core = percent(strength);
  const shoulder = percent(strength * 0.45);
  return {
    background: `radial-gradient(closest-side, color-mix(in srgb, var(--color-signal) ${core}, transparent), color-mix(in srgb, var(--color-signal) ${shoulder}, transparent) 45%, transparent 100%)`,
  };
}

function sceneFor(kind: BackdropKind): Scene {
  switch (kind) {
    case "frontend":
      return {
        motif: <FrontendMotif />,
        glows: [
          {
            place: "-right-[14rem] -top-[10rem] size-[46rem]",
            strength: 0.15,
            drift: "motion-safe:animate-[backdrop-drift-a_26s_ease-in-out_infinite_alternate]",
          },
          {
            place: "-left-[18rem] top-[46%] size-[40rem]",
            strength: 0.1,
            drift: "motion-safe:animate-[backdrop-drift-b_22s_ease-in-out_infinite_alternate]",
          },
        ],
      };
    case "backend":
      return {
        motif: <BackendMotif />,
        glows: [
          {
            place: "-right-[12rem] -top-[4rem] size-[42rem]",
            strength: 0.14,
            drift: "motion-safe:animate-[backdrop-drift-b_24s_ease-in-out_infinite_alternate]",
          },
          {
            place: "left-[12%] -bottom-[18rem] size-[44rem]",
            strength: 0.11,
            drift: "motion-safe:animate-[backdrop-drift-a_30s_ease-in-out_infinite_alternate]",
          },
        ],
      };
    case "ai":
      return {
        motif: <AiMotif />,
        glows: [
          {
            place: "-right-[16rem] -top-[8rem] size-[48rem]",
            strength: 0.16,
            drift: "motion-safe:animate-[backdrop-drift-a_20s_ease-in-out_infinite_alternate]",
          },
          {
            place: "-left-[14rem] top-[40%] size-[38rem]",
            strength: 0.1,
            drift: "motion-safe:animate-[backdrop-drift-b_28s_ease-in-out_infinite_alternate]",
          },
        ],
      };
    default:
      return assertNever(kind);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled backdrop: ${String(value)}`);
}

/**
 * The decorative layer behind a domain chapter: soft orange glows that drift,
 * a faint warm tint, and a large low-contrast motif with scroll parallax.
 * Transforms and opacity only; frozen off screen; still under reduced motion.
 * The chapter must be positioned, and its content must sit above (relative) it.
 */
export function DomainBackdrop({ kind }: Readonly<{ kind: BackdropKind }>): ReactNode {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() === true;
  const onScreen = useInView(rootRef, { margin: "20% 0px" });
  const { scrollYProgress } = useScroll({ target: rootRef, offset: ["start end", "end start"] });
  const travel = reduced ? 0 : PARALLAX_TRAVEL;
  const motifY = useTransform(scrollYProgress, (progress) => parallaxOffset(progress, travel));
  const scene = sceneFor(kind);

  // SVG <animateMotion> keeps its own clock, which CSS cannot pause.
  useEffect(() => {
    const root = rootRef.current;
    if (root === null) {
      return;
    }
    root.querySelectorAll("svg").forEach((svg) => {
      if (onScreen) {
        svg.unpauseAnimations();
      } else {
        svg.pauseAnimations();
      }
    });
  }, [onScreen]);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className={cx("pointer-events-none absolute inset-0 overflow-hidden", !onScreen && PAUSED)}
    >
      {scene.glows.map((glow) => (
        <div key={glow.place} className={cx("absolute rounded-full", glow.place, glow.drift)} style={glowStyle(glow.strength)} />
      ))}
      <div className="absolute inset-0" style={TINT} />
      <motion.div className={MOTIF_BOX} style={{ y: motifY }}>
        <div style={MOTIF_MASK_STYLE}>{scene.motif}</div>
      </motion.div>
    </div>
  );
}
