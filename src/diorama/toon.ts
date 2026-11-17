import type { Tone } from "./Solid";

/** How one tone is painted: its colour, whether it gets an ink outline, and whether it glows. */
export type ToonPaint = Readonly<{ color: string; outline: boolean; glow?: string }>;

/**
 * The diorama's toy-plastic paints: deep friendly blues for the walls (the back one a touch lighter, so the
 * corner reads), honey planks, a signal-orange rug, warm wood, fresh greens, cream and a warm ink for the
 * gear, and small pops of sunny yellow and soft pink. Tiny details go without an outline.
 */
export const TOON: Readonly<Record<Tone, ToonPaint>> = {
  wallBack: { color: "#4b66ea", outline: true },
  wallLeft: { color: "#3c52cf", outline: true },
  wainscot: { color: "#3346b8", outline: true },
  trim: { color: "#fff1dc", outline: true },
  plank: { color: "#f2b766", outline: true },
  plankAlt: { color: "#e9a956", outline: true },
  earth: { color: "#8c5337", outline: true },
  bedrock: { color: "#4d2d38", outline: true },
  rug: { color: "#ff5a1f", outline: true },
  rugEdge: { color: "#ffe3bb", outline: true },
  wood: { color: "#dc8c4f", outline: true },
  woodDark: { color: "#ad6136", outline: true },
  cream: { color: "#fff5e2", outline: true },
  key: { color: "#f4e4c8", outline: false },
  ink: { color: "#33263f", outline: true },
  screen: { color: "#33263f", outline: false },
  signal: { color: "#ff5a1f", outline: true },
  leaf: { color: "#44c872", outline: true },
  leafDark: { color: "#25a05c", outline: true },
  sunny: { color: "#ffcc33", outline: true },
  pink: { color: "#ff8db0", outline: true },
  sky: { color: "#9ddcff", outline: false },
  cloud: { color: "#ffffff", outline: true },
  steam: { color: "#ffffff", outline: false },
  board: { color: "#ffe8c2", outline: true },
  hole: { color: "#dfbf8e", outline: false },
  bulb: { color: "#fff7d6", outline: false, glow: "#ffe7a3" },
  coffee: { color: "#6e3d2b", outline: false },
  starOff: { color: "#ecd3a7", outline: true },
};

/** The one warm dark ink every outline is drawn in. Never pure black. */
export const INK = "#2a1d33";

/** The colours the tinted pieces change between. */
export const TINTS = {
  /** The toggle's knob: a sun in the light theme, a pale moon in the dark. */
  sun: TOON.sunny.color,
  moon: "#dce5ff",
  /** A star: unlit, and lit. */
  starOff: TOON.starOff.color,
  starOn: "#ffc426",
} as const;

/** The lights: warm daylight, a sky-and-floor fill so shade is tinted rather than grey, and the lamp's warm glow. */
export const LIGHT = {
  key: "#fff3e0",
  sky: "#cdd8ff",
  ground: "#ffcf9c",
  lamp: "#ffd98a",
  /** The soft shadow the island casts on the page, a tinted shade rather than grey. */
  shadow: "#3a2a5c",
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
