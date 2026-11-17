import type { ClayTone } from "./ClaySolid";

/** How one clay tone is painted: its colour, how matte it is, and whether it glows. */
export type ClayPaint = Readonly<{ color: string; roughness: number; glow?: string }>;

/**
 * The room's clay: warm off-whites from the site's paper, an ink that reads as matte black rather than a hole,
 * one warm wood, a muted sage for the plant, and the signal orange. Everything is matte, so the light does
 * the work.
 */
export const CLAY: Readonly<Record<ClayTone, ClayPaint>> = {
  plaster: { color: "#efede8", roughness: 0.95 },
  floor: { color: "#e4e1da", roughness: 0.95 },
  rug: { color: "#d9d6cd", roughness: 1 },
  white: { color: "#f7f6f2", roughness: 0.85 },
  paper: { color: "#fbfaf7", roughness: 0.9 },
  stone: { color: "#cfccc3", roughness: 0.9 },
  wood: { color: "#d8bf9c", roughness: 0.8 },
  ink: { color: "#232321", roughness: 0.75 },
  metal: { color: "#c9c8c3", roughness: 0.55 },
  signal: { color: "#ff5a1f", roughness: 0.7 },
  leaf: { color: "#9fae95", roughness: 0.85 },
  board: { color: "#e8e5dd", roughness: 0.95 },
  bulb: { color: "#fff4e0", roughness: 0.5, glow: "#ffd9a8" },
};

/** The light parts of the scene: the desk lamp's warm spot and the cooler daylight from the open side. */
export const LIGHT = {
  lamp: "#ffd3a8",
  sun: "#fffaf2",
  /** The page's paper, which the room stands on. */
  ground: "#fbfaf7",
} as const;

/** `hex` darkened toward black by `factor` (1 keeps it, 0 is black), as a `#rrggbb` string. */
export function shade(hex: string, factor: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  const channel = (shift: number): string =>
    Math.round(((value >> shift) & 0xff) * Math.min(1, Math.max(0, factor)))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(16)}${channel(8)}${channel(0)}`;
}
