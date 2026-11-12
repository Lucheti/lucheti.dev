import type { SpecNote } from "@/content";

export type NoteId = SpecNote["id"];

export type Point = Readonly<{ x: number; y: number }>;

export type Rect = Readonly<{ x: number; y: number; width: number; height: number }>;

/** Every box is in the overlay's own coordinate space (its top-left is 0,0). */
export type SpecMeasure = Readonly<{
  stage: Readonly<{ width: number; height: number }>;
  card: Rect;
  glyph: Rect;
  title: Rect;
  subtitle: Rect;
  toggle: Rect;
  action: Rect;
  /** The card's inner padding in px. */
  padding: number;
  /** The card's corner radius in px. */
  radius: number;
}>;

/** One drawn redline. Dashed shapes are outlines; solid ones are dimension lines and guides. */
export type Shape = Readonly<{ d: string; dashed: boolean }>;

export type TagSide = "left" | "right";

export type Annotation = Readonly<{
  id: NoteId;
  /** 1-based position in the notes, shown on the redline when the labels become a legend. */
  number: number;
  anchor: Point;
  shapes: readonly Shape[];
  /** The line from the anchor out to the tag. */
  leader: string;
  tag: Readonly<{ x: number; y: number; side: TagSide; width: number; height: number }>;
}>;

export type SpecLayout = Readonly<{
  /** "tags" when the margins around the card are wide enough for the labels; otherwise a legend. */
  mode: "tags" | "legend";
  annotations: readonly Annotation[];
}>;

export const TAG_WIDTH = 124;
const TAG_GAP = 28;
const ELBOW = 8;
const MIN_TAG_SPACING = 8;
const EDGE_MARGIN = 4;
const DEFAULT_TAG_HEIGHT = 56;
const TAG_HEIGHTS: Readonly<Partial<Record<NoteId, number>>> = { motion: 96 };
const TICK = 4;
const OUTLINE_GAP = 3;

type Draft = Readonly<{ anchor: Point; shapes: readonly Shape[]; side: TagSide }>;

type DraftBuilder = (measure: SpecMeasure) => Draft;

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function right(rect: Rect): number {
  return rect.x + rect.width;
}

function bottom(rect: Rect): number {
  return rect.y + rect.height;
}

function middleY(rect: Rect): number {
  return rect.y + rect.height / 2;
}

function outline(rect: Rect, grow: number): string {
  const x0 = round(rect.x - grow);
  const y0 = round(rect.y - grow);
  const x1 = round(right(rect) + grow);
  const y1 = round(bottom(rect) + grow);
  return `M${x0} ${y0}H${x1}V${y1}H${x0}Z`;
}

function horizontalDimension(x0: number, x1: number, y: number): string {
  return `M${round(x0)} ${round(y)}H${round(x1)}M${round(x0)} ${round(y - TICK)}V${round(y + TICK)}M${round(x1)} ${round(y - TICK)}V${round(y + TICK)}`;
}

function verticalDimension(x: number, y0: number, y1: number): string {
  return `M${round(x)} ${round(y0)}V${round(y1)}M${round(x - TICK)} ${round(y0)}H${round(x + TICK)}M${round(x - TICK)} ${round(y1)}H${round(x + TICK)}`;
}

/** Each note knows where it points on the real card; the card's own measurements place it. */
const DRAFTS: Readonly<Record<NoteId, DraftBuilder>> = {
  padding: ({ card, glyph, padding }) => {
    const y = middleY(glyph);
    const content: Rect = {
      x: card.x + padding,
      y: card.y + padding,
      width: card.width - padding * 2,
      height: card.height - padding * 2,
    };
    return {
      anchor: { x: card.x + padding / 2, y },
      side: "left",
      shapes: [
        { d: outline(content, 0), dashed: true },
        { d: horizontalDimension(card.x, card.x + padding, y), dashed: false },
        { d: verticalDimension(card.x + card.width / 2, card.y, card.y + padding), dashed: false },
      ],
    };
  },
  radius: ({ card, radius }) => {
    const edge = right(card);
    const centre: Point = { x: edge - radius, y: card.y + radius };
    const diagonal = radius * Math.SQRT1_2;
    return {
      anchor: { x: round(centre.x + diagonal), y: round(centre.y - diagonal) },
      side: "right",
      shapes: [
        { d: `M${round(centre.x)} ${round(card.y)}A${radius} ${radius} 0 0 1 ${round(edge)} ${round(centre.y)}`, dashed: false },
        {
          d: `M${round(centre.x)} ${round(card.y)}L${round(centre.x)} ${round(centre.y)}L${round(edge)} ${round(centre.y)}`,
          dashed: true,
        },
      ],
    };
  },
  type: ({ title }) => ({
    anchor: { x: right(title), y: middleY(title) },
    side: "right",
    shapes: [
      { d: `M${round(title.x)} ${round(bottom(title))}H${round(right(title))}`, dashed: false },
      { d: `M${round(title.x)} ${round(title.y)}H${round(right(title))}`, dashed: true },
    ],
  }),
  contrast: ({ subtitle }) => ({
    anchor: { x: subtitle.x - OUTLINE_GAP, y: middleY(subtitle) },
    side: "left",
    shapes: [{ d: outline(subtitle, OUTLINE_GAP), dashed: false }],
  }),
  focus: ({ action }) => ({
    anchor: { x: action.x, y: middleY(action) },
    side: "left",
    shapes: [],
  }),
  motion: ({ toggle }) => {
    const y = bottom(toggle) + 8;
    return {
      anchor: { x: right(toggle), y },
      side: "right",
      shapes: [{ d: horizontalDimension(toggle.x, right(toggle), y), dashed: false }],
    };
  },
  role: ({ toggle }) => ({
    anchor: { x: right(toggle) + OUTLINE_GAP, y: toggle.y - OUTLINE_GAP },
    side: "right",
    shapes: [{ d: outline(toggle, OUTLINE_GAP), dashed: true }],
  }),
};

type Slot = Readonly<{ desired: number; height: number }>;

/**
 * Centres for a column of tags: each as close to where it wants to be as possible,
 * kept in order, at least `spacing` apart and inside [min, max].
 */
export function spreadCentres(slots: readonly Slot[], spacing: number, min: number, max: number): readonly number[] {
  const order = slots.map((_, index) => index).sort((a, b) => slots[a].desired - slots[b].desired);
  const tops = new Map<number, number>();
  let floor = min;
  for (const index of order) {
    const top = Math.max(slots[index].desired - slots[index].height / 2, floor);
    tops.set(index, top);
    floor = top + slots[index].height + spacing;
  }
  let ceiling = max;
  for (const index of [...order].reverse()) {
    const top = Math.min(tops.get(index) ?? min, ceiling - slots[index].height);
    tops.set(index, top);
    ceiling = top - spacing;
  }
  return slots.map((slot, index) => (tops.get(index) ?? min) + slot.height / 2);
}

/** Turns the card's measured boxes into redlines, leaders and tag positions. Pure: same boxes, same layout. */
export class SpecAnnotator {
  private readonly ids: readonly NoteId[];

  public constructor(ids: readonly NoteId[]) {
    if (new Set(ids).size !== ids.length) {
      throw new Error("Each note id may appear once.");
    }
    this.ids = ids;
  }

  public annotate(measure: SpecMeasure): SpecLayout {
    const drafts = this.ids.map((id) => DRAFTS[id](measure));
    const centres = this.tagCentres(drafts, measure);

    const annotations = this.ids.map((id, index): Annotation => {
      const draft = drafts[index];
      const tagY = centres[index];
      const direction = draft.side === "right" ? 1 : -1;
      const edge = draft.side === "right" ? right(measure.card) : measure.card.x;
      const elbowX = edge + direction * ELBOW;
      const tagX = edge + direction * TAG_GAP;
      return {
        id,
        number: index + 1,
        anchor: draft.anchor,
        shapes: draft.shapes,
        leader: `M${round(draft.anchor.x)} ${round(draft.anchor.y)}H${round(elbowX)}L${round(tagX)} ${round(tagY)}`,
        tag: {
          x: round(tagX),
          y: round(tagY),
          side: draft.side,
          width: TAG_WIDTH,
          height: TAG_HEIGHTS[id] ?? DEFAULT_TAG_HEIGHT,
        },
      };
    });

    return { mode: this.fitsTags(measure) ? "tags" : "legend", annotations };
  }

  private fitsTags({ stage, card }: SpecMeasure): boolean {
    const margin = Math.min(card.x, stage.width - right(card));
    return margin >= TAG_GAP + TAG_WIDTH + EDGE_MARGIN;
  }

  private tagCentres(drafts: readonly Draft[], measure: SpecMeasure): readonly number[] {
    const centres: number[] = Array.from({ length: drafts.length }, () => 0);
    for (const side of ["left", "right"] as const) {
      const members = drafts.map((draft, index) => ({ draft, index })).filter(({ draft }) => draft.side === side);
      const placed = spreadCentres(
        members.map(({ draft, index }) => ({ desired: draft.anchor.y, height: TAG_HEIGHTS[this.ids[index]] ?? DEFAULT_TAG_HEIGHT })),
        MIN_TAG_SPACING,
        EDGE_MARGIN,
        measure.stage.height - EDGE_MARGIN,
      );
      members.forEach(({ index }, position) => {
        centres[index] = placed[position];
      });
    }
    return centres;
  }
}
