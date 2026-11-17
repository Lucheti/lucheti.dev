import type { LayerSurface, Tone, Weight } from "./CardBlueprint";

/**
 * The floating card's colours, in the diorama's toy palette: warm cream for the paper, a periwinkle and a
 * honey for the picture, the diorama's warm ink, and the signal orange for the interaction layer.
 */
export const TONES: Readonly<Record<Tone, string>> = {
  paper: "#fff5e2",
  white: "#ffffff",
  mist: "#d9e2ff",
  stone: "#f3c98a",
  slate: "#8fa2ff",
  graphite: "#3d2f52",
  ink: "#2a1d33",
  signal: "#ff5a1f",
};

/** How opaque a hairline of each weight is. */
export const WEIGHTS: Readonly<Record<Weight, number>> = {
  faint: 0.12,
  fine: 0.3,
  firm: 0.55,
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

/** A solid slab is warm cream; a glass one is a white sheet you can see through, with a warm edge. */
export const SURFACES: Readonly<Record<LayerSurface, SlabPaint>> = {
  solid: { top: "#fff5e2", topOpacity: 1, wallLit: "#ffe3b8", wallShade: "#f0c487", wallOpacity: 1, edge: "firm" },
  glass: { top: "#ffffff", topOpacity: 0.62, wallLit: "#fff0d6", wallShade: "#f5d3a2", wallOpacity: 0.95, edge: "firm" },
};

/** The soft shadow under the stack. */
export const SHADOW = { color: "#2a1d33", opacity: 0.18 } as const;

/** How far the shadow sits toward the viewer from the bottom slab, and how soft it is, in card units. */
export const SHADOW_SHIFT = 0.14;
export const SHADOW_SOFTNESS = 0.16;
