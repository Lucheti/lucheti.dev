import type { LayerKind } from "@/content";
import { assertNever } from "./assertNever";
import { circle, grow, placed, roundedBox, type CardBox, type CardPoint, type Outline } from "./outline";

/** The few colours the model is painted in. `signal` is the accent and belongs to the interaction layer alone. */
export type Tone = "paper" | "white" | "mist" | "stone" | "slate" | "graphite" | "ink" | "signal";

/** How strongly a hairline reads: from a barely-there grid to a full-strength outline. */
export type Weight = "faint" | "fine" | "firm" | "solid";

/** One thing drawn on a layer's face, in the card's plane. */
export type Mark =
  /** A filled area, optionally with one hole (a ring). */
  | Readonly<{ kind: "fill"; tone: Tone; outline: Outline; hole?: Outline }>
  /** A hairline along a path, joined back to its start when `closed`. */
  | Readonly<{ kind: "stroke"; tone: Tone; weight: Weight; path: Outline; closed: boolean }>
  /** Rings that keep spreading from a point and fading: the only part of a layer that moves on its own. */
  | Readonly<{ kind: "ripple"; tone: Tone; centre: CardPoint; radius: number; width: number }>;

/** A solid slab is opaque; a glass one lets the layers under it show through, washed. */
export type LayerSurface = "solid" | "glass";

/** One slab of the stack: what it is, how it is made and what is drawn on it, in drawing order. */
export type LayerSpec = Readonly<{ kind: LayerKind; surface: LayerSurface; thickness: number; marks: readonly Mark[] }>;

/** The card's size on its plane, in model units, and how round its corners are. */
export type CardFootprint = Readonly<{ width: number; depth: number; radius: number }>;

/** Bottom to top: the order the layers stack in. */
export const LAYER_ORDER: readonly LayerKind[] = ["tokens", "layout", "components", "content", "interaction"];

const CARD: CardFootprint = { width: 2.5, depth: 3.5, radius: 0.16 };
const SOLID_THICKNESS = 0.09;
const GLASS_THICKNESS = 0.035;

/** The card's regions, shared by every layer so the stack lines up into one card when it closes. */
const INSET = 1.05;
const HEADER: CardBox = { left: -INSET, top: -1.55, right: INSET, bottom: -1.03 };
const MEDIA: CardBox = { left: -INSET, top: -0.9, right: INSET, bottom: 0.42 };
const BODY: CardBox = { left: -INSET, top: 0.56, right: INSET, bottom: 1.0 };
const ACTIONS: CardBox = { left: -INSET, top: 1.12, right: INSET, bottom: 1.55 };
const AVATAR: CardPoint = { u: -0.79, v: -1.29 };
const BUTTON: CardBox = { left: 0.17, top: 1.17, right: INSET, bottom: 1.5 };
const TOGGLE: CardBox = { left: -INSET, top: 1.215, right: -0.57, bottom: 1.455 };
const POINTER_TIP: CardPoint = { u: 0.78, v: 1.34 };

/** The classic arrow pointer, tip at the origin, about one unit tall, pointing to the card's top left. */
const ARROW: readonly (readonly [number, number])[] = [
  [0, 0],
  [0, 1],
  [0.25, 0.77],
  [0.41, 1.12],
  [0.54, 1.06],
  [0.38, 0.72],
  [0.7, 0.72],
];

/**
 * The exploded card: five layers, bottom to top, each with what a designer would put on it. Owns the rule
 * that the layers share one footprint and one set of regions, so closed up they read as a single card.
 */
export class CardBlueprint {
  private readonly specs: readonly LayerSpec[];

  public constructor() {
    this.specs = LAYER_ORDER.map((kind) => CardBlueprint.layer(kind));
  }

  /** The layers, bottom to top. */
  public layers(): readonly LayerSpec[] {
    return this.specs;
  }

  /** The card's size. */
  public footprint(): CardFootprint {
    return CARD;
  }

  /** The slab's outline on the card's plane. */
  public slab(): Outline {
    return roundedBox(this.bounds(), CARD.radius);
  }

  /** The card's edges on its plane, centred on the origin. */
  public bounds(): CardBox {
    return { left: -CARD.width / 2, top: -CARD.depth / 2, right: CARD.width / 2, bottom: CARD.depth / 2 };
  }

  /** The thickest slab, for measuring the stack. */
  public maxThickness(): number {
    return Math.max(...this.specs.map((spec) => spec.thickness));
  }

  /** The point of the top-right corner's curve that sticks out furthest to the right in the isometric view: where a label's leader starts. */
  public labelCorner(): CardPoint {
    const inset = CARD.radius * (1 - Math.SQRT1_2);
    return { u: CARD.width / 2 - inset, v: -CARD.depth / 2 + inset };
  }

  private static layer(kind: LayerKind): LayerSpec {
    switch (kind) {
      case "tokens":
        return { kind, surface: "solid", thickness: SOLID_THICKNESS, marks: CardBlueprint.tokens() };
      case "layout":
        return { kind, surface: "glass", thickness: GLASS_THICKNESS, marks: CardBlueprint.layout() };
      case "components":
        return { kind, surface: "glass", thickness: GLASS_THICKNESS, marks: CardBlueprint.components() };
      case "content":
        return { kind, surface: "glass", thickness: GLASS_THICKNESS, marks: CardBlueprint.content() };
      case "interaction":
        return { kind, surface: "glass", thickness: GLASS_THICKNESS, marks: CardBlueprint.interaction() };
      default:
        return assertNever(kind);
    }
  }

  /** A faint grid over the top, a row of radius and spacing tokens, and a row of colour swatches. */
  private static tokens(): readonly Mark[] {
    const marks: Mark[] = [];
    const gridTop = -1.55;
    const gridBottom = 0.5;
    for (let u = -1; u <= 1.0001; u += 0.25) {
      marks.push(CardBlueprint.line({ u, v: gridTop }, { u, v: gridBottom }, "faint"));
    }
    for (let v = gridTop; v <= gridBottom + 0.0001; v += 0.25) {
      marks.push(CardBlueprint.line({ u: -INSET, v }, { u: INSET, v }, "faint"));
    }
    const size = 0.28;
    [0, 0.06, 0.14].forEach((radius, index) => {
      const left = -INSET + index * 0.36;
      const box = { left, top: 0.72, right: left + size, bottom: 0.72 + size };
      marks.push({ kind: "stroke", tone: "ink", weight: "firm", path: roundedBox(box, radius), closed: true });
    });
    [0.06, 0.1, 0.14, 0.2].forEach((step, index) => {
      const left = 0.13 + index * 0.24;
      const box = { left, top: 1.0 - step, right: left + step, bottom: 1.0 };
      marks.push({ kind: "fill", tone: "stone", outline: roundedBox(box, 0.02) });
    });
    const swatches: readonly Tone[] = ["ink", "graphite", "slate", "stone", "white"];
    swatches.forEach((tone, index) => {
      const left = -INSET + index * 0.38;
      const outline = roundedBox({ left, top: 1.2, right: left + 0.3, bottom: 1.5 }, 0.05);
      marks.push({ kind: "fill", tone, outline });
      if (tone === "white") {
        marks.push({ kind: "stroke", tone: "ink", weight: "fine", path: outline, closed: true });
      }
    });
    return marks;
  }

  /** Wireframe boxes of the card's regions, with the usual cross through the image placeholder. */
  private static layout(): readonly Mark[] {
    const frame = (box: CardBox): Mark => ({
      kind: "stroke",
      tone: "ink",
      weight: "firm",
      path: roundedBox(box, 0.06),
      closed: true,
    });
    return [
      frame(HEADER),
      frame(MEDIA),
      frame(BODY),
      frame(ACTIONS),
      { kind: "stroke", tone: "ink", weight: "fine", path: circle(AVATAR, 0.2), closed: true },
      CardBlueprint.line({ u: MEDIA.left, v: MEDIA.top }, { u: MEDIA.right, v: MEDIA.bottom }, "fine"),
      CardBlueprint.line({ u: MEDIA.right, v: MEDIA.top }, { u: MEDIA.left, v: MEDIA.bottom }, "fine"),
    ];
  }

  /** The filled shapes: an avatar, a title bar, a toggle and a button. */
  private static components(): readonly Mark[] {
    return [
      { kind: "fill", tone: "slate", outline: circle(AVATAR, 0.2) },
      { kind: "fill", tone: "graphite", outline: roundedBox({ left: -0.45, top: -1.4, right: 0.55, bottom: -1.29 }, 0.055) },
      { kind: "fill", tone: "ink", outline: roundedBox(TOGGLE, 1) },
      { kind: "fill", tone: "white", outline: circle({ u: TOGGLE.right - 0.12, v: (TOGGLE.top + TOGGLE.bottom) / 2 }, 0.085) },
      { kind: "fill", tone: "ink", outline: roundedBox(BUTTON, 0.07) },
    ];
  }

  /** The words and the picture: a subtitle, an image with a sun and hills, lines of text and the button's label. */
  private static content(): readonly Mark[] {
    const bar = (left: number, top: number, right: number, height: number, tone: Tone): Mark => ({
      kind: "fill",
      tone,
      outline: roundedBox({ left, top, right, bottom: top + height }, height / 2),
    });
    return [
      bar(-0.45, -1.22, 0.2, 0.05, "stone"),
      { kind: "fill", tone: "mist", outline: roundedBox(MEDIA, 0.06) },
      { kind: "fill", tone: "white", outline: circle({ u: 0.52, v: -0.46 }, 0.16) },
      {
        kind: "fill",
        tone: "stone",
        outline: [
          { u: -0.99, v: MEDIA.bottom },
          { u: -0.99, v: 0.2 },
          { u: -0.42, v: -0.28 },
          { u: 0.02, v: 0.12 },
          { u: 0.36, v: -0.1 },
          { u: 0.99, v: 0.3 },
          { u: 0.99, v: MEDIA.bottom },
        ],
      },
      {
        kind: "fill",
        tone: "slate",
        outline: [
          { u: -0.99, v: MEDIA.bottom },
          { u: -0.99, v: 0.34 },
          { u: -0.62, v: 0.12 },
          { u: -0.2, v: 0.42 },
        ],
      },
      bar(-INSET, 0.6, INSET, 0.055, "stone"),
      bar(-INSET, 0.74, 0.8, 0.055, "stone"),
      bar(-INSET, 0.88, 0.25, 0.055, "stone"),
      bar(0.4, 1.31, 0.82, 0.05, "white"),
    ];
  }

  /** The visitor's hand: an orange focus ring round the button, a pointer on it and a ripple where it pressed. */
  private static interaction(): readonly Mark[] {
    const arrow = placed(ARROW, POINTER_TIP, 0.34);
    return [
      { kind: "fill", tone: "signal", outline: roundedBox(grow(BUTTON, 0.075), 0.145), hole: roundedBox(grow(BUTTON, 0.04), 0.11) },
      { kind: "ripple", tone: "signal", centre: POINTER_TIP, radius: 0.3, width: 0.022 },
      { kind: "fill", tone: "ink", outline: arrow },
      { kind: "stroke", tone: "white", weight: "solid", path: arrow, closed: true },
    ];
  }

  private static line(from: CardPoint, to: CardPoint, weight: Weight): Mark {
    return { kind: "stroke", tone: "ink", weight, path: [from, to], closed: false };
  }
}
