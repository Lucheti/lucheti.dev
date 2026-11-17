import type { LayerSurface, Tone, Weight } from "./CardBlueprint";

/** The model's colours, from the site's tokens: paper, ink, a few warm greys between them, and the signal orange. */
export const TONES: Readonly<Record<Tone, string>> = {
  paper: "#f3f2ee",
  white: "#ffffff",
  mist: "#eeede8",
  stone: "#dddcd5",
  slate: "#bdbcb4",
  graphite: "#46463f",
  ink: "#0e0e0e",
  signal: "#ff5a1f",
};

/** How opaque a hairline of each weight is. */
export const WEIGHTS: Readonly<Record<Weight, number>> = {
  faint: 0.07,
  fine: 0.2,
  firm: 0.4,
  solid: 1,
};

/** A slab's paint: its top face, its walls (lit on the left, shaded on the right) and how opaque each is. */
export type SlabPaint = Readonly<{
  top: string;
  topOpacity: number;
  wallLit: string;
  wallShade: string;
  wallOpacity: number;
  /** The hairline round its top face. */
  edge: Weight;
}>;

/** A solid slab is warm paper; a glass one is a white sheet you can see through, with a slightly firmer edge. */
export const SURFACES: Readonly<Record<LayerSurface, SlabPaint>> = {
  solid: { top: "#f3f2ee", topOpacity: 1, wallLit: "#e6e5df", wallShade: "#d3d2cb", wallOpacity: 1, edge: "fine" },
  glass: { top: "#ffffff", topOpacity: 0.5, wallLit: "#eeede8", wallShade: "#d6d5ce", wallOpacity: 0.95, edge: "fine" },
};

/** The soft shadow under the stack. */
export const SHADOW = { color: "#0e0e0e", opacity: 0.16 } as const;

/** How far the shadow sits toward the viewer from the bottom slab, and how soft it is, in card units. */
export const SHADOW_SHIFT = 0.14;
export const SHADOW_SOFTNESS = 0.16;
