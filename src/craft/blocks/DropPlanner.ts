import type { BlockKind } from "@/content";
import { assertNever } from "./assertNever";
import { SHELF_ORDER } from "./blockFootprint";
import type { CardLayout, LayoutChange } from "./CardLayout";

/** What is being dragged: a chip off the shelf, or a block already on the card. */
export type DragSubject = Readonly<{ source: "shelf"; kind: BlockKind }> | Readonly<{ source: "card"; id: string }>;

/** Whether a value carried by a drag (which the drag-and-drop library types as `any`) is a drag subject. */
export function isDragSubject(value: unknown): value is DragSubject {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Readonly<Record<string, unknown>>;
  switch (record.source) {
    case "shelf":
      return SHELF_ORDER.some((kind) => kind === record.kind);
    case "card":
      return typeof record.id === "string";
    default:
      return false;
  }
}

/** Where it is over: a block (and which half of it), the card itself, or anywhere off the card. */
export type DropTarget =
  | Readonly<{ zone: "block"; id: string; after: boolean }>
  | Readonly<{ zone: "card" }>
  | Readonly<{ zone: "away" }>;

/** What a drop asks the card to do. */
export type LayoutCommand =
  | Readonly<{ kind: "add"; block: BlockKind; at: number }>
  | Readonly<{ kind: "move"; id: string; to: number }>
  | Readonly<{ kind: "remove"; id: string }>
  | Readonly<{ kind: "keep" }>;

/**
 * Turns a drag and the place it ends into a change to the card. A shelf chip goes in before or after
 * the block it is over, or at the end; a card block takes the place of the block it is over, stays put
 * over the card's own padding, and comes off the card when dropped anywhere else.
 */
export class DropPlanner {
  /** The command a drop of `subject` on `target` stands for. */
  public plan(subject: DragSubject, target: DropTarget, layout: CardLayout): LayoutCommand {
    switch (subject.source) {
      case "shelf": {
        const at = this.insertionIndex(subject, target, layout);
        return at === null ? { kind: "keep" } : { kind: "add", block: subject.kind, at };
      }
      case "card":
        return this.planMove(subject.id, target, layout);
      default:
        return assertNever(subject);
    }
  }

  /**
   * Where a shelf chip would land, for drawing the insertion line: before or after the block it is over,
   * or at the end of the card. Null for card blocks, and for chips off the card.
   */
  public insertionIndex(subject: DragSubject, target: DropTarget, layout: CardLayout): number | null {
    if (subject.source !== "shelf") {
      return null;
    }
    switch (target.zone) {
      case "block": {
        const index = layout.indexOf(target.id);
        return index === -1 ? layout.count() : index + (target.after ? 1 : 0);
      }
      case "card":
        return layout.count();
      case "away":
        return null;
      default:
        return assertNever(target);
    }
  }

  /** Whether a dragged item whose centre is at `centreY` sits in the lower half of a box at `top`, `height` tall. */
  public isAfter(centreY: number, top: number, height: number): boolean {
    return centreY > top + height / 2;
  }

  /** Carries a command out on the card. */
  public apply(command: LayoutCommand, layout: CardLayout): LayoutChange {
    switch (command.kind) {
      case "add":
        return layout.add(command.block, command.at);
      case "move":
        return layout.move(command.id, command.to);
      case "remove":
        return layout.remove(command.id);
      case "keep":
        return { kind: "unchanged", layout };
      default:
        return assertNever(command);
    }
  }

  private planMove(id: string, target: DropTarget, layout: CardLayout): LayoutCommand {
    switch (target.zone) {
      case "block": {
        const to = layout.indexOf(target.id);
        return to === -1 || target.id === id ? { kind: "keep" } : { kind: "move", id, to };
      }
      case "card":
        return { kind: "keep" };
      case "away":
        return { kind: "remove", id };
      default:
        return assertNever(target);
    }
  }
}
