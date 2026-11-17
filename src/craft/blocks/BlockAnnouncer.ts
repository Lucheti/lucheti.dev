import type { BlockKind, BlockMessages } from "@/content";
import { assertNever } from "./assertNever";
import type { CardLayout, LayoutChange } from "./CardLayout";
import type { DragSubject, DropTarget } from "./DropPlanner";

/** The values a message template can name. */
export type TemplateValues = Readonly<{ block?: string; position?: number; count?: number }>;

/** Fills `{block}`, `{position}` and `{count}` in a template; a token without a value is left as written. */
export function fillTemplate(template: string, values: TemplateValues): string {
  return template.replace(/\{(block|position|count)\}/g, (token, key: keyof TemplateValues) => {
    const value = values[key];
    return value === undefined ? token : String(value);
  });
}

/**
 * The building-blocks toy's words for screen readers: what each change did, and what a drag is doing.
 * Positions are read out 1-based.
 */
export class BlockAnnouncer {
  private readonly names: Readonly<Record<BlockKind, string>>;
  private readonly messages: BlockMessages;

  public constructor(names: Readonly<Record<BlockKind, string>>, messages: BlockMessages) {
    this.names = names;
    this.messages = messages;
  }

  /** A block kind's name, as the shelf shows it. */
  public name(kind: BlockKind): string {
    return this.names[kind];
  }

  /** A template filled with a block kind's name, e.g. a handle's accessible name. */
  public labelFor(template: string, kind: BlockKind): string {
    return fillTemplate(template, { block: this.name(kind) });
  }

  /** What a change did, or null when it did nothing. */
  public describe(change: LayoutChange): string | null {
    const count = change.layout.count();
    switch (change.kind) {
      case "added":
        return this.say(this.messages.added, change.block.kind, change.position + 1, count);
      case "moved":
        return this.say(this.messages.moved, change.block.kind, change.position + 1, count);
      case "removed":
        return this.say(this.messages.removed, change.block.kind);
      case "refused":
        return this.say(this.messages.refused, change.wanted);
      case "reset":
        return this.messages.reset;
      case "unchanged":
        return null;
      default:
        return assertNever(change);
    }
  }

  /** A drag has started. */
  public pickedUp(subject: DragSubject, layout: CardLayout): string | undefined {
    const kind = this.kindOf(subject, layout);
    return kind === undefined ? undefined : this.say(this.messages.pickedUp, kind);
  }

  /** A card block is being dragged over a place; shelf chips say nothing until they land. */
  public over(subject: DragSubject, target: DropTarget, layout: CardLayout): string | undefined {
    if (subject.source !== "card") {
      return undefined;
    }
    const kind = this.kindOf(subject, layout);
    if (kind === undefined) {
      return undefined;
    }
    switch (target.zone) {
      case "block":
        return this.say(this.messages.over, kind, layout.indexOf(target.id) + 1, layout.count());
      case "card":
        return undefined;
      case "away":
        return this.say(this.messages.away, kind);
      default:
        return assertNever(target);
    }
  }

  /** A drag was cancelled. */
  public cancelled(subject: DragSubject, layout: CardLayout): string | undefined {
    const kind = this.kindOf(subject, layout);
    return kind === undefined ? undefined : this.say(this.messages.cancelled, kind);
  }

  private kindOf(subject: DragSubject, layout: CardLayout): BlockKind | undefined {
    switch (subject.source) {
      case "shelf":
        return subject.kind;
      case "card":
        return layout.find(subject.id)?.kind;
      default:
        return assertNever(subject);
    }
  }

  private say(template: string, kind: BlockKind, position?: number, count?: number): string {
    return fillTemplate(template, { block: this.name(kind), position, count });
  }
}
