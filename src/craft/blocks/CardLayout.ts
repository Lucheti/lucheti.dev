import type { BlockKind } from "@/content";

/** One block on the card: what it is, and a key that stays with it while it moves. */
export type CardBlock = Readonly<{ id: string; kind: BlockKind }>;

/** How much of the card's height a block takes. */
export type Footprint = (kind: BlockKind) => number;

/** What a change did to the card, with the card afterwards. Positions are 0-based. */
export type LayoutChange =
  | Readonly<{ kind: "added"; layout: CardLayout; block: CardBlock; position: number }>
  | Readonly<{ kind: "moved"; layout: CardLayout; block: CardBlock; position: number }>
  | Readonly<{ kind: "removed"; layout: CardLayout; block: CardBlock }>
  | Readonly<{ kind: "refused"; layout: CardLayout; wanted: BlockKind }>
  | Readonly<{ kind: "reset"; layout: CardLayout }>
  | Readonly<{ kind: "unchanged"; layout: CardLayout }>;

type LayoutRules = Readonly<{
  /** The blocks a new card starts with, and a reset goes back to. */
  starter: readonly BlockKind[];
  /** The card's room, in the footprint's units; the blocks on it may never take more. */
  room: number;
  footprint: Footprint;
}>;

/**
 * The phone card of the building-blocks toy: an ordered stack of blocks that never outgrows its room.
 * Immutable: every change returns a new layout, so React can hold it as state. Block ids keep counting
 * up across resets, so a block that comes back is a new block.
 */
export class CardLayout {
  private readonly rules: LayoutRules;
  private readonly items: readonly CardBlock[];
  private readonly serial: number;

  private constructor(rules: LayoutRules, items: readonly CardBlock[], serial: number) {
    this.rules = rules;
    this.items = items;
    this.serial = serial;
  }

  /** A card holding the starter blocks; throws if the room is not a positive number or they don't fit in it. */
  public static create(rules: LayoutRules): CardLayout {
    if (!Number.isFinite(rules.room) || rules.room <= 0) {
      throw new Error(`A card needs room above zero: ${rules.room}`);
    }
    const starter = CardLayout.stack(rules.starter, 0);
    const layout = new CardLayout(rules, starter, starter.length);
    if (layout.used() > rules.room) {
      throw new Error(`The starter blocks (${layout.used()}) don't fit the card's room (${rules.room})`);
    }
    return layout;
  }

  /** The blocks, top to bottom. */
  public blocks(): readonly CardBlock[] {
    return this.items;
  }

  /** The blocks' ids, top to bottom. */
  public ids(): readonly string[] {
    return this.items.map((block) => block.id);
  }

  public count(): number {
    return this.items.length;
  }

  /** The 0-based position of a block, or -1 when it is not on the card. */
  public indexOf(id: string): number {
    return this.items.findIndex((block) => block.id === id);
  }

  public find(id: string): CardBlock | undefined {
    return this.items.find((block) => block.id === id);
  }

  /** How much room the blocks take. */
  public used(): number {
    return this.items.reduce((sum, block) => sum + this.rules.footprint(block.kind), 0);
  }

  /** Whether a block of this kind still fits. */
  public fits(kind: BlockKind): boolean {
    return this.used() + this.rules.footprint(kind) <= this.rules.room;
  }

  /** The kinds, in the given order, that are not on the card yet and would fit: what to suggest next. */
  public suggestions(order: readonly BlockKind[]): readonly BlockKind[] {
    return order.filter((kind) => this.fits(kind) && !this.items.some((block) => block.kind === kind));
  }

  /** Whether the card holds exactly the starter blocks, in order. */
  public isStarter(): boolean {
    const starter = this.rules.starter;
    return this.items.length === starter.length && this.items.every((block, index) => block.kind === starter[index]);
  }

  /** Puts a new block at `at` (clamped to the stack; the end by default), unless it doesn't fit. */
  public add(kind: BlockKind, at: number = this.items.length): LayoutChange {
    if (!this.fits(kind)) {
      return { kind: "refused", layout: this, wanted: kind };
    }
    const position = CardLayout.clamp(at, this.items.length);
    const block: CardBlock = { id: CardLayout.idFor(this.serial), kind };
    const items = [...this.items.slice(0, position), block, ...this.items.slice(position)];
    return { kind: "added", layout: new CardLayout(this.rules, items, this.serial + 1), block, position };
  }

  /** Moves a block to position `to` (clamped), the others closing up around it. */
  public move(id: string, to: number): LayoutChange {
    const from = this.indexOf(id);
    if (from === -1) {
      return { kind: "unchanged", layout: this };
    }
    const position = CardLayout.clamp(to, this.items.length - 1);
    if (position === from) {
      return { kind: "unchanged", layout: this };
    }
    const block = this.items[from];
    const rest = this.items.filter((item) => item.id !== id);
    const items = [...rest.slice(0, position), block, ...rest.slice(position)];
    return { kind: "moved", layout: new CardLayout(this.rules, items, this.serial), block, position };
  }

  /** Takes a block off the card. */
  public remove(id: string): LayoutChange {
    const block = this.find(id);
    if (block === undefined) {
      return { kind: "unchanged", layout: this };
    }
    const items = this.items.filter((item) => item.id !== id);
    return { kind: "removed", layout: new CardLayout(this.rules, items, this.serial), block };
  }

  /** Goes back to the starter blocks, as new blocks. */
  public reset(): LayoutChange {
    const items = CardLayout.stack(this.rules.starter, this.serial);
    return { kind: "reset", layout: new CardLayout(this.rules, items, this.serial + items.length) };
  }

  private static stack(kinds: readonly BlockKind[], firstSerial: number): readonly CardBlock[] {
    return kinds.map((kind, offset) => ({ id: CardLayout.idFor(firstSerial + offset), kind }));
  }

  private static idFor(serial: number): string {
    return `block-${serial + 1}`;
  }

  private static clamp(position: number, last: number): number {
    if (!Number.isFinite(position)) {
      return last;
    }
    return Math.min(Math.max(Math.trunc(position), 0), last);
  }
}
