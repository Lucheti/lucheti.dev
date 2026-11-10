"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import type { BackdropManifest } from "@/content";
import { useStory } from "@/story";
import { BackdropController } from "./BackdropController";
import { BrowserImageSource } from "./BrowserImageSource";
import { StillProgress } from "./StillProgress";

type BackdropProps = Readonly<{
  manifest: BackdropManifest;
}>;

/** Where the reduced-motion backdrop rests: a frame with the core clearly visible. */
const STILL_FRACTION = 0.35;

const INK = "6 7 6";

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const overlay = "absolute inset-0";

const scrim: CSSProperties = {
  background: `linear-gradient(to right, rgb(${INK} / 0.7), rgb(${INK} / 0) 60%)`,
};

const vignette: CSSProperties = {
  background: `radial-gradient(ellipse at center, rgb(${INK} / 0) 55%, rgb(${INK} / 0.55) 100%)`,
};

const bottomFade: CSSProperties = {
  background: `linear-gradient(to bottom, rgb(${INK} / 0), rgb(${INK}))`,
};

const grain: CSSProperties = {
  backgroundImage: GRAIN,
  opacity: 0.05,
};

/** The fixed video-frame layer behind everything, scrubbed by page scroll. */
export function Backdrop({ manifest }: BackdropProps): ReactNode {
  const story = useStory();
  const reducedMotion = useReducedMotion() === true;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) {
      return undefined;
    }
    const controller = new BackdropController({
      canvas,
      page: reducedMotion ? new StillProgress(STILL_FRACTION) : story.page(),
      manifest,
      source: new BrowserImageSource(),
      scrubbing: !reducedMotion,
    });
    controller.start();
    return () => controller.dispose();
  }, [story, manifest, reducedMotion]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 bg-ink">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className={overlay} style={scrim} />
      <div className={`${overlay} bg-ink/45 lg:hidden`} />
      <div className={overlay} style={vignette} />
      <div
        className="absolute inset-x-0 bottom-0 h-[20%]"
        style={bottomFade}
      />
      <div className={overlay} style={grain} />
    </div>
  );
}
