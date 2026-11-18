import { useId, type ReactNode } from "react";
import { cx } from "@/ui";
import { assertNever } from "./assertNever";
import type { Corner } from "./corner";

/** The picture is painted for the top-left corner; the top-right one sees it in a mirror, glow and all. */
function mirrorFor(corner: Corner): string | undefined {
  switch (corner.kind) {
    case "top-left":
      return undefined;
    case "top-right":
      return "-scale-x-100";
    default:
      return assertNever(corner);
  }
}

/**
 * The desktop picture, made for this site: warm folds of light in the signal orange, from a pale apricot glow
 * at the corner down to deep ember, with a fine grain so it reads as a picture rather than a flat gradient.
 * Drawn once in SVG; it never moves. Its ids are made per use, so two laptops on one page keep their own.
 */
export function Wallpaper({ corner }: Readonly<{ corner: Corner }>): ReactNode {
  const id = useId();
  const ref = (name: string): string => `${id}-${name}`;
  const url = (name: string): string => `url(#${ref(name)})`;
  return (
    <svg aria-hidden className={cx("absolute inset-0 size-full", mirrorFor(corner))} viewBox="0 0 1000 760" preserveAspectRatio="xMinYMin slice">
      <defs>
        <linearGradient id={ref("sky")} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#ffd9b8" />
          <stop offset="0.28" stopColor="#ff9a5c" />
          <stop offset="0.55" stopColor="#ff5a1f" />
          <stop offset="1" stopColor="#a8300d" />
        </linearGradient>
        <linearGradient id={ref("fold-a")} x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0" stopColor="#ffe6cf" stopOpacity="0.95" />
          <stop offset="0.45" stopColor="#ffb07a" stopOpacity="0.8" />
          <stop offset="1" stopColor="#ff6a2b" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={ref("fold-b")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff7b3a" />
          <stop offset="0.6" stopColor="#e2430f" />
          <stop offset="1" stopColor="#8f260a" />
        </linearGradient>
        <linearGradient id={ref("fold-c")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7a1e06" stopOpacity="0.85" />
          <stop offset="1" stopColor="#c2410c" stopOpacity="0.2" />
        </linearGradient>
        <filter id={ref("soft")} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <filter id={ref("haze")} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="60" />
        </filter>
        <filter id={ref("grain")}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0.2  0 0 0 0 0.08  0 0 0 0 0.02  0 0 0 0.55 0" />
        </filter>
      </defs>
      <rect width="1000" height="760" fill={url("sky")} />
      <ellipse cx="120" cy="40" rx="360" ry="200" fill="#fff3e6" opacity="0.75" filter={url("haze")} />
      <path
        d="M-60 250 C 140 170 320 300 520 230 S 860 120 1080 190 L 1080 420 C 860 360 700 470 500 450 S 120 380 -60 470 Z"
        fill={url("fold-a")}
        filter={url("soft")}
      />
      <path
        d="M-60 430 C 160 360 330 480 560 420 S 900 300 1080 360 L 1080 800 L -60 800 Z"
        fill={url("fold-b")}
        filter={url("soft")}
      />
      <path
        d="M-60 600 C 200 520 420 640 640 580 S 940 500 1080 540 L 1080 800 L -60 800 Z"
        fill={url("fold-c")}
        filter={url("soft")}
      />
      <path d="M-40 236 C 160 160 330 292 530 222 S 870 112 1080 182" fill="none" stroke="#fff4ea" strokeOpacity="0.55" strokeWidth="2" filter={url("soft")} />
      <rect width="1000" height="760" filter={url("grain")} opacity="0.22" />
    </svg>
  );
}
