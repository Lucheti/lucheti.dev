import { describe, expect, it } from "vitest";
import type { BlockKind } from "@/content";
import { blockFootprint, CARD_ROOM, SHELF_ORDER } from "./blockFootprint";
import { CardLayout, type LayoutChange } from "./CardLayout";

const STARTER: readonly BlockKind[] = ["avatar", "title", "text", "button"];

/** Every block takes 10; the room is 60, so six blocks fit. */
function layout(starter: readonly BlockKind[] = STARTER, room = 60): CardLayout {
  return CardLayout.create({ starter, room, footprint: () => 10 });
}

function kinds(card: CardLayout): readonly BlockKind[] {
  return card.blocks().map((block) => block.kind);
}

function after(change: LayoutChange): CardLayout {
  return change.layout;
}

describe("CardLayout", () => {
  it("starts with the starter blocks, each with its own id", () => {
    const card = layout();
    expect(kinds(card)).toEqual(STARTER);
    expect(new Set(card.ids()).size).toBe(4);
    expect(card.isStarter()).toBe(true);
  });

  it("refuses a starter that does not fit, and a room that is not above zero", () => {
    expect(() => layout(STARTER, 30)).toThrow(/don't fit/);
    expect(() => layout(STARTER, 0)).toThrow(/room/);
  });

  it("appends by default and inserts at a clamped position", () => {
    const appended = layout().add("badge");
    expect(appended.kind).toBe("added");
    expect(kinds(after(appended))).toEqual([...STARTER, "badge"]);

    const first = layout().add("image", -3);
    expect(kinds(after(first))).toEqual(["image", ...STARTER]);
    expect(first.kind === "added" && first.position).toBe(0);

    const middle = layout().add("toggle", 2);
    expect(kinds(after(middle))).toEqual(["avatar", "title", "toggle", "text", "button"]);
  });

  it("gives every added block a fresh id, and leaves the old layout alone", () => {
    const card = layout();
    const once = after(card.add("badge"));
    const twice = after(once.add("badge"));
    expect(new Set(twice.ids()).size).toBe(6);
    expect(card.count()).toBe(4);
  });

  it("refuses a block that would not fit, without changing the card", () => {
    const full = after(after(layout().add("badge")).add("rating"));
    expect(full.fits("image")).toBe(false);
    const change = full.add("image");
    expect(change).toEqual({ kind: "refused", layout: full, wanted: "image" });
  });

  it("enforces the room by footprint, not by count", () => {
    const card = CardLayout.create({
      starter: ["avatar"],
      room: 50,
      footprint: (kind) => (kind === "image" ? 30 : 10),
    });
    expect(card.fits("image")).toBe(true);
    const withImage = after(card.add("image"));
    expect(withImage.used()).toBe(40);
    expect(withImage.fits("image")).toBe(false);
    expect(withImage.fits("badge")).toBe(true);
  });

  it("moves a block, the others closing up around it", () => {
    const card = layout();
    const [avatar] = card.ids();
    const down = card.move(avatar, 2);
    expect(down.kind).toBe("moved");
    expect(kinds(after(down))).toEqual(["title", "text", "avatar", "button"]);

    const last = card.ids()[3];
    expect(kinds(after(card.move(last, 0)))).toEqual(["button", "avatar", "title", "text"]);
    expect(kinds(after(card.move(avatar, 99)))).toEqual(["title", "text", "button", "avatar"]);
  });

  it("reports a move to the same place, or of an unknown block, as unchanged", () => {
    const card = layout();
    expect(card.move(card.ids()[1], 1).kind).toBe("unchanged");
    expect(card.move("block-404", 0).kind).toBe("unchanged");
  });

  it("removes a block by id", () => {
    const card = layout();
    const title = card.ids()[1];
    const change = card.remove(title);
    expect(change.kind === "removed" && change.block.kind).toBe("title");
    expect(kinds(after(change))).toEqual(["avatar", "text", "button"]);
    expect(after(change).isStarter()).toBe(false);
    expect(card.remove("block-404").kind).toBe("unchanged");
  });

  it("resets to the starter blocks with new ids", () => {
    const card = after(after(layout().add("badge")).remove(layout().ids()[0]));
    const change = card.reset();
    expect(change.kind).toBe("reset");
    const fresh = after(change);
    expect(kinds(fresh)).toEqual(STARTER);
    expect(fresh.isStarter()).toBe(true);
    expect(fresh.ids().some((id) => card.ids().includes(id))).toBe(false);
  });

  it("suggests the kinds that are missing and still fit, in shelf order", () => {
    const card = CardLayout.create({
      starter: ["avatar", "title"],
      room: 50,
      footprint: (kind) => (kind === "image" ? 40 : 10),
    });
    expect(card.suggestions(SHELF_ORDER)).toEqual(["text", "button", "toggle", "badge", "rating"]);
  });
});

describe("the real footprints", () => {
  it("fit the starter card with room for a couple more blocks, an image among them", () => {
    const card = CardLayout.create({ starter: STARTER, room: CARD_ROOM, footprint: blockFootprint });
    const withImage = after(card.add("image"));
    expect(withImage.count()).toBe(5);
    expect(withImage.fits("badge")).toBe(true);
  });

  it("never let the card take more than its room, whatever is added", () => {
    let card = CardLayout.create({ starter: STARTER, room: CARD_ROOM, footprint: blockFootprint });
    for (let round = 0; round < 40; round += 1) {
      card = after(card.add(SHELF_ORDER[round % SHELF_ORDER.length]));
    }
    expect(card.used()).toBeLessThanOrEqual(CARD_ROOM);
    expect(SHELF_ORDER.some((kind) => card.fits(kind))).toBe(false);
  });
});
