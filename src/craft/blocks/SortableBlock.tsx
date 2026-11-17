"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { KeyboardEvent, ReactNode } from "react";
import { cx } from "@/ui";
import type { CardBlock } from "./CardLayout";
import type { DragSubject } from "./DropPlanner";

type SortableBlockProps = Readonly<{
  block: CardBlock;
  handleLabel: string;
  removeLabel: string;
  /** Dragged off the card: it will come off when dropped. */
  away: boolean;
  /** Drop the library's settle transition, for reduced motion. */
  still: boolean;
  onRemove: () => void;
  children: ReactNode;
}>;

/** The keys that take a block off the card while its handle has focus. */
const REMOVE_KEYS: ReadonlySet<string> = new Set(["Delete", "Backspace"]);

/** Six dots: the grip a block is dragged by. */
function Grip(): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 8 14" className="h-3.5 w-2" fill="currentColor">
      {[2, 7, 12].map((y) => (
        <g key={y}>
          <circle cx="2" cy={y} r="1.15" />
          <circle cx="6" cy={y} r="1.15" />
        </g>
      ))}
    </svg>
  );
}

/**
 * A block on the phone card, sortable by its grip (pointer, touch or keyboard) and removable by its ×
 * or the Delete key. The grip sits in the card's left margin and the × on its top-right corner; both
 * show on hover and focus, and always on touch screens.
 */
export function SortableBlock({ block, handleLabel, removeLabel, away, still, onRemove, children }: SortableBlockProps): ReactNode {
  const subject: DragSubject = { source: "card", id: block.id };
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { subject },
  });

  const onHandleKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (REMOVE_KEYS.has(event.key) && !isDragging) {
      event.preventDefault();
      onRemove();
      return;
    }
    listeners?.onKeyDown?.(event);
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition: still ? undefined : transition }}
      className={cx(
        "group/block relative rounded-[10px] before:pointer-events-none before:absolute before:-inset-1.5 before:rounded-[12px] before:ring-1 before:transition-[box-shadow,background-color] before:duration-200",
        blockSkin(isDragging, away),
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        onKeyDown={onHandleKeyDown}
        aria-label={handleLabel}
        className={cx(
          "absolute -left-[18px] top-1/2 flex h-7 w-3.5 -translate-y-1/2 touch-none items-center justify-center rounded-[5px] transition-[opacity,color] duration-200",
          isDragging
            ? "cursor-grabbing text-ink opacity-100"
            : "cursor-grab text-ink/35 opacity-0 hover:text-ink group-hover/block:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100",
        )}
      >
        <Grip />
      </button>
      <div className="relative">{children}</div>
      {isDragging ? null : (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className={cx(
            "absolute -right-3 -top-3 z-10 flex size-5 items-center justify-center rounded-full bg-ink text-white shadow-[0_2px_6px_rgb(14_14_14/0.3)] ring-2 ring-white transition-[opacity,transform,background-color] duration-200 ease-out-expo hover:bg-signal hover:text-ink motion-reduce:transition-none",
            "scale-75 opacity-0 group-hover/block:scale-100 group-hover/block:opacity-100 focus-visible:scale-100 focus-visible:opacity-100 pointer-coarse:scale-90 pointer-coarse:opacity-100",
          )}
        >
          <svg aria-hidden viewBox="0 0 10 10" className="size-2" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
            <path d="m2 2 6 6M8 2 2 8" />
          </svg>
        </button>
      )}
    </div>
  );
}

/** A block's outline: faint on hover and focus at rest, a lifted white tile while dragged, orange and faded when off the card. */
function blockSkin(dragging: boolean, away: boolean): string {
  if (!dragging) {
    return "before:ring-transparent hover:before:ring-ink/10 focus-within:before:ring-ink/10";
  }
  const lifted = "z-20 before:bg-white before:shadow-[0_18px_36px_-16px_rgb(14_14_14/0.45)]";
  return away ? cx(lifted, "opacity-50 before:ring-signal/60") : cx(lifted, "before:ring-ink/10");
}
