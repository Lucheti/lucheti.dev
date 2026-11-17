import type { BlockKind } from "@/content";
import { assertNever } from "./assertNever";

/** Every block kind, in the order the shelf shows them. */
export const SHELF_ORDER: readonly BlockKind[] = ["avatar", "title", "text", "image", "button", "toggle", "badge", "rating"];

/** The space between two blocks on the card, in px. */
export const BLOCK_GAP = 8;

/**
 * How much of the card's height a block takes, in px, with the gap under it. The values match the blocks'
 * rendered heights, rounded up, so a card the layout accepts never outgrows the panel.
 */
export function blockFootprint(kind: BlockKind): number {
  switch (kind) {
    case "avatar":
      return 36 + BLOCK_GAP;
    case "title":
      return 22 + BLOCK_GAP;
    case "text":
      return 38 + BLOCK_GAP;
    case "image":
      return 72 + BLOCK_GAP;
    case "button":
      return 36 + BLOCK_GAP;
    case "toggle":
      return 36 + BLOCK_GAP;
    case "badge":
      return 24 + BLOCK_GAP;
    case "rating":
      return 24 + BLOCK_GAP;
    default:
      return assertNever(kind);
  }
}

/** The card's room for blocks, in px of footprint: the starter card leaves room for two or three more. */
export const CARD_ROOM = 290;
