import { describe, expect, it } from "vitest";
import type { BlockMessages } from "@/content";
import { BlockAnnouncer, fillTemplate } from "./BlockAnnouncer";
import { CardLayout } from "./CardLayout";

const NAMES = {
  avatar: "Avatar",
  title: "Title",
  text: "Text",
  image: "Image",
  button: "Button",
  toggle: "Toggle",
  badge: "Badge",
  rating: "Rating",
} as const;

const MESSAGES: BlockMessages = {
  added: "{block} added at {position} of {count}.",
  moved: "{block} moved to {position} of {count}.",
  removed: "{block} removed.",
  refused: "No room for {block}.",
  reset: "Reset.",
  pickedUp: "Picked up {block}.",
  over: "{block} over {position} of {count}.",
  away: "{block} is off the card.",
  cancelled: "{block} stays.",
  instructions: "Use the handle.",
};

const announcer = new BlockAnnouncer(NAMES, MESSAGES);

function layout(): CardLayout {
  return CardLayout.create({ starter: ["avatar", "title"], room: 30, footprint: () => 10 });
}

describe("fillTemplate", () => {
  it("fills the tokens it has values for and leaves the others", () => {
    expect(fillTemplate("{block} at {position} of {count}", { block: "Title", position: 2, count: 4 })).toBe("Title at 2 of 4");
    expect(fillTemplate("{position} of {count} stars", { position: 3 })).toBe("3 of {count} stars");
    expect(fillTemplate("no {tokens} here", {})).toBe("no {tokens} here");
  });
});

describe("BlockAnnouncer", () => {
  it("reads changes out with 1-based positions", () => {
    const card = layout();
    expect(announcer.describe(card.add("badge", 0))).toBe("Badge added at 1 of 3.");
    expect(announcer.describe(card.move(card.ids()[0], 1))).toBe("Avatar moved to 2 of 2.");
    expect(announcer.describe(card.remove(card.ids()[1]))).toBe("Title removed.");
    expect(announcer.describe(card.reset())).toBe("Reset.");
  });

  it("says when a block doesn't fit, and nothing when nothing changed", () => {
    const full = layout().add("badge").layout;
    expect(announcer.describe(full.add("image"))).toBe("No room for Image.");
    expect(announcer.describe(full.move("block-404", 0))).toBeNull();
  });

  it("names what a drag picked up, from the shelf or the card", () => {
    const card = layout();
    expect(announcer.pickedUp({ source: "shelf", kind: "rating" }, card)).toBe("Picked up Rating.");
    expect(announcer.pickedUp({ source: "card", id: card.ids()[1] }, card)).toBe("Picked up Title.");
    expect(announcer.pickedUp({ source: "card", id: "block-404" }, card)).toBeUndefined();
  });

  it("follows a card block over the card and off it", () => {
    const card = layout();
    const [avatar, title] = card.ids();
    const subject = { source: "card", id: avatar } as const;
    expect(announcer.over(subject, { zone: "block", id: title, after: false }, card)).toBe("Avatar over 2 of 2.");
    expect(announcer.over(subject, { zone: "away" }, card)).toBe("Avatar is off the card.");
    expect(announcer.over(subject, { zone: "card" }, card)).toBeUndefined();
    expect(announcer.over({ source: "shelf", kind: "badge" }, { zone: "card" }, card)).toBeUndefined();
  });

  it("labels controls and cancelled drags by block name", () => {
    expect(announcer.labelFor("Move {block}", "toggle")).toBe("Move Toggle");
    expect(announcer.cancelled({ source: "shelf", kind: "image" }, layout())).toBe("Image stays.");
  });
});
