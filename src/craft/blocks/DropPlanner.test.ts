import { describe, expect, it } from "vitest";
import { CardLayout } from "./CardLayout";
import { DropPlanner, isDragSubject } from "./DropPlanner";

const planner = new DropPlanner();

describe("isDragSubject", () => {
  it("accepts shelf chips of a known kind and card blocks with an id", () => {
    expect(isDragSubject({ source: "shelf", kind: "rating" })).toBe(true);
    expect(isDragSubject({ source: "card", id: "block-3" })).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isDragSubject(undefined)).toBe(false);
    expect(isDragSubject({ source: "shelf", kind: "carousel" })).toBe(false);
    expect(isDragSubject({ source: "card", id: 3 })).toBe(false);
    expect(isDragSubject({ source: "tray" })).toBe(false);
  });
});

/** avatar, title, text; every block takes 10 of 40, so one more fits. */
function layout(): CardLayout {
  return CardLayout.create({ starter: ["avatar", "title", "text"], room: 40, footprint: () => 10 });
}

describe("DropPlanner", () => {
  describe("a chip from the shelf", () => {
    const chip = { source: "shelf", kind: "badge" } as const;

    it("goes in before or after the block it is over", () => {
      const card = layout();
      const title = card.ids()[1];
      expect(planner.plan(chip, { zone: "block", id: title, after: false }, card)).toEqual({ kind: "add", block: "badge", at: 1 });
      expect(planner.plan(chip, { zone: "block", id: title, after: true }, card)).toEqual({ kind: "add", block: "badge", at: 2 });
    });

    it("goes at the end when it is over the card itself", () => {
      expect(planner.plan(chip, { zone: "card" }, layout())).toEqual({ kind: "add", block: "badge", at: 3 });
    });

    it("does nothing off the card", () => {
      expect(planner.plan(chip, { zone: "away" }, layout())).toEqual({ kind: "keep" });
      expect(planner.insertionIndex(chip, { zone: "away" }, layout())).toBeNull();
    });
  });

  describe("a block on the card", () => {
    it("takes the place of the block it is over", () => {
      const card = layout();
      const [avatar, , text] = card.ids();
      expect(planner.plan({ source: "card", id: avatar }, { zone: "block", id: text, after: false }, card)).toEqual({
        kind: "move",
        id: avatar,
        to: 2,
      });
    });

    it("stays put over itself or over the card's padding", () => {
      const card = layout();
      const [avatar] = card.ids();
      expect(planner.plan({ source: "card", id: avatar }, { zone: "block", id: avatar, after: true }, card)).toEqual({ kind: "keep" });
      expect(planner.plan({ source: "card", id: avatar }, { zone: "card" }, card)).toEqual({ kind: "keep" });
    });

    it("comes off the card when dropped anywhere else", () => {
      const card = layout();
      const [avatar] = card.ids();
      expect(planner.plan({ source: "card", id: avatar }, { zone: "away" }, card)).toEqual({ kind: "remove", id: avatar });
    });

    it("draws no insertion line", () => {
      const card = layout();
      expect(planner.insertionIndex({ source: "card", id: card.ids()[0] }, { zone: "card" }, card)).toBeNull();
    });
  });

  it("splits a box at its middle", () => {
    expect(planner.isAfter(149, 100, 100)).toBe(false);
    expect(planner.isAfter(151, 100, 100)).toBe(true);
  });

  it("carries each command out on the card", () => {
    const card = layout();
    const [avatar, title] = card.ids();
    expect(planner.apply({ kind: "add", block: "image", at: 0 }, card).kind).toBe("added");
    expect(planner.apply({ kind: "move", id: avatar, to: 1 }, card).kind).toBe("moved");
    expect(planner.apply({ kind: "remove", id: title }, card).kind).toBe("removed");
    expect(planner.apply({ kind: "keep" }, card)).toEqual({ kind: "unchanged", layout: card });
  });

  it("lets the card refuse a drop that does not fit", () => {
    const full = layout().add("badge").layout;
    const command = planner.plan({ source: "shelf", kind: "image" }, { zone: "card" }, full);
    expect(planner.apply(command, full).kind).toBe("refused");
  });
});
