import { describe, expect, it } from "vitest";
import { SpecAnnotator, spreadCentres, TAG_WIDTH, type NoteId, type Rect, type SpecMeasure } from "./SpecAnnotator";

const ALL: readonly NoteId[] = ["padding", "radius", "type", "contrast", "focus", "motion", "role"];

function rect(x: number, y: number, width: number, height: number): Rect {
  return { x, y, width, height };
}

/** A card of the specimen's shape inside a stage of the given width, centred. */
function measureIn(stageWidth: number, stageHeight = 500): SpecMeasure {
  const cardWidth = 340;
  const x = (stageWidth - cardWidth) / 2;
  const y = 110;
  return {
    stage: { width: stageWidth, height: stageHeight },
    card: rect(x, y, cardWidth, 280),
    glyph: rect(x + 24, y + 24, 36, 36),
    title: rect(x + 24, y + 76, 80, 24),
    subtitle: rect(x + 24, y + 100, 200, 20),
    toggle: rect(x + cardWidth - 24 - 44, y + 160, 44, 24),
    action: rect(x + 24, y + 216, cardWidth - 48, 40),
    padding: 24,
    radius: 16,
  };
}

describe("spreadCentres", () => {
  it("leaves tags where they want to be when there is room", () => {
    expect(spreadCentres([{ desired: 50, height: 20 }, { desired: 200, height: 20 }], 8, 0, 400)).toEqual([50, 200]);
  });

  it("pushes overlapping tags apart, keeping their order", () => {
    const [first, second, third] = spreadCentres(
      [{ desired: 100, height: 40 }, { desired: 104, height: 40 }, { desired: 110, height: 40 }],
      8,
      0,
      600,
    );
    expect(second - first).toBeGreaterThanOrEqual(48);
    expect(third - second).toBeGreaterThanOrEqual(48);
  });

  it("keeps the column inside the bounds, shifting it back up at the bottom", () => {
    const centres = spreadCentres([{ desired: 190, height: 40 }, { desired: 195, height: 40 }], 8, 0, 200);
    expect(centres[1] + 20).toBeLessThanOrEqual(200);
    expect(centres[1] - centres[0]).toBeGreaterThanOrEqual(48);
  });

  it("answers in the order it was asked", () => {
    const centres = spreadCentres([{ desired: 300, height: 20 }, { desired: 10, height: 20 }], 8, 0, 400);
    expect(centres[0]).toBeGreaterThan(centres[1]);
  });
});

describe("SpecAnnotator", () => {
  const annotator = new SpecAnnotator(ALL);

  it("annotates every note, numbered in order", () => {
    const { annotations } = annotator.annotate(measureIn(700));
    expect(annotations.map((annotation) => annotation.id)).toEqual(ALL);
    expect(annotations.map((annotation) => annotation.number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("follows the card: moving the card moves every anchor by the same amount", () => {
    const base = annotator.annotate(measureIn(700));
    const wider = annotator.annotate(measureIn(800));
    base.annotations.forEach((annotation, index) => {
      expect(wider.annotations[index].anchor.x - annotation.anchor.x).toBeCloseTo(50);
      expect(wider.annotations[index].anchor.y).toBeCloseTo(annotation.anchor.y);
    });
  });

  it("measures the padding dimension lines from the card edge", () => {
    const measure = measureIn(700);
    const padding = annotator.annotate(measure).annotations[0];
    const x0 = measure.card.x;
    expect(padding.shapes[1].d.startsWith(`M${x0} `)).toBe(true);
    expect(padding.shapes[1].d).toContain(`H${x0 + 24}`);
  });

  it("anchors the radius callout on the card's top-right arc", () => {
    const measure = measureIn(700);
    const radius = annotator.annotate(measure).annotations[1];
    const centre = { x: measure.card.x + measure.card.width - 16, y: measure.card.y + 16 };
    expect(Math.hypot(radius.anchor.x - centre.x, radius.anchor.y - centre.y)).toBeCloseTo(16, 1);
  });

  it("puts the tags in the margins, none overlapping within a side", () => {
    const measure = measureIn(700);
    const { mode, annotations } = annotator.annotate(measure);
    expect(mode).toBe("tags");
    for (const side of ["left", "right"] as const) {
      const column = annotations.filter((annotation) => annotation.tag.side === side).sort((a, b) => a.tag.y - b.tag.y);
      for (let index = 1; index < column.length; index += 1) {
        const gap = column[index].tag.y - column[index].tag.height / 2 - (column[index - 1].tag.y + column[index - 1].tag.height / 2);
        expect(gap).toBeGreaterThanOrEqual(8 - 1e-6);
      }
      for (const { tag } of column) {
        expect(tag.y - tag.height / 2).toBeGreaterThanOrEqual(0);
        expect(tag.y + tag.height / 2).toBeLessThanOrEqual(measure.stage.height);
        const near = tag.side === "right" ? tag.x : tag.x - TAG_WIDTH;
        expect(near).toBeGreaterThanOrEqual(0);
        expect(near + TAG_WIDTH).toBeLessThanOrEqual(measure.stage.width);
      }
    }
  });

  it("falls back to a legend when the margins are too narrow for tags", () => {
    expect(annotator.annotate(measureIn(420)).mode).toBe("legend");
  });

  it("rejects duplicate note ids", () => {
    expect(() => new SpecAnnotator(["padding", "padding"])).toThrow();
  });

  it("annotates only the notes it is given", () => {
    const { annotations } = new SpecAnnotator(["type", "role"]).annotate(measureIn(700));
    expect(annotations.map((annotation) => annotation.id)).toEqual(["type", "role"]);
    expect(annotations.map((annotation) => annotation.number)).toEqual([1, 2]);
  });
});
