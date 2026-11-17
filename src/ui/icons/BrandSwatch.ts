/** The two inks a brand mark can take on its own colour. */
export type SwatchInk = "#ffffff" | "#111111";

/** A brand colour ready to paint: the fill, the ink for the mark on it, and whether it needs an edge. */
export type BrandSwatch = Readonly<{
  /** The brand colour as `#rrggbb`. */
  fill: string;
  /** White or near-black, whichever has the higher WCAG contrast against the fill. */
  ink: SwatchInk;
  /** True when the fill sits so close to the ground that the circle needs a hairline to hold its shape. */
  edge: boolean;
}>;

type Rgb = Readonly<{ r: number; g: number; b: number }>;

const WHITE: SwatchInk = "#ffffff";
const NEAR_BLACK: SwatchInk = "#111111";

/** Below this contrast against its ground a swatch melts into it (TanStack's cream on paper). */
const EDGE_CONTRAST = 1.35;

const HEX = /^#?([0-9a-f]{6})$/i;

function parse(hex: string): Rgb {
  const match = HEX.exec(hex.trim());
  if (match === null) {
    throw new Error(`Not a six-digit hex colour: "${hex}"`);
  }
  const value = Number.parseInt(match[1], 16);
  return { r: (value >> 16) & 0xff, g: (value >> 8) & 0xff, b: value & 0xff };
}

/** One sRGB channel, 0–255, in linear light (WCAG 2.2). */
function linear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
function luminance(rgb: Rgb): number {
  return 0.2126 * linear(rgb.r) + 0.7152 * linear(rgb.g) + 0.0722 * linear(rgb.b);
}

function ratio(a: number, b: number): number {
  const [light, dark] = a >= b ? [a, b] : [b, a];
  return (light + 0.05) / (dark + 0.05);
}

/** The WCAG contrast ratio of two hex colours, from 1 to 21. */
export function contrastRatio(first: string, second: string): number {
  return ratio(luminance(parse(first)), luminance(parse(second)));
}

/**
 * Paints a brand colour (Simple Icons ships it as `hex`, without the hash) as a swatch on a ground:
 * the mark goes white or near-black by WCAG contrast, and a fill too close to the ground asks for an edge.
 */
export function brandSwatch(hex: string, ground: string): BrandSwatch {
  const fill = parse(hex);
  const fillLuminance = luminance(fill);
  const onWhite = ratio(fillLuminance, luminance(parse(WHITE)));
  const onNearBlack = ratio(fillLuminance, luminance(parse(NEAR_BLACK)));
  return {
    fill: `#${((fill.r << 16) | (fill.g << 8) | fill.b).toString(16).padStart(6, "0")}`,
    ink: onWhite >= onNearBlack ? WHITE : NEAR_BLACK,
    edge: ratio(fillLuminance, luminance(parse(ground))) < EDGE_CONTRAST,
  };
}
