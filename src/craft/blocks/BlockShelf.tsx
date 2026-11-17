"use client";

import { useDraggable } from "@dnd-kit/core";
import { useId, type ReactNode } from "react";
import type { BlockKind } from "@/content";
import { cx } from "@/ui";
import { BlockGlyph } from "./BlockGlyph";
import type { DragSubject } from "./DropPlanner";

type ChipFaceProps = Readonly<{ kind: BlockKind; name: string; nudging?: boolean; lifted?: boolean }>;

/** A shelf chip's face: the block's glyph on a small tile, its name under it. */
export function ChipFace({ kind, name, nudging = false, lifted = false }: ChipFaceProps): ReactNode {
  return (
    <span
      className={cx(
        "flex w-full flex-col items-center gap-1.5 rounded-xl bg-white px-1 pb-2 pt-2.5 text-[11.5px] font-medium text-ink ring-1 transition-[box-shadow,transform] duration-200 ease-out-expo",
        chipSkin(nudging, lifted),
      )}
    >
      <span
        className={cx(
          "flex size-7 items-center justify-center rounded-lg transition-colors duration-300",
          nudging || lifted ? "bg-signal text-ink" : "bg-paper text-ink",
        )}
      >
        <BlockGlyph kind={kind} className="size-4" />
      </span>
      <span className="max-w-full truncate leading-none">{name}</span>
    </span>
  );
}

/** A chip's ring, shadow and motion: resting (lifting on hover), bobbing to invite a touch, or lifted by a drag. */
function chipSkin(nudging: boolean, lifted: boolean): string {
  if (lifted) {
    return "-rotate-3 scale-105 ring-ink/20 shadow-[0_22px_40px_-18px_rgb(14_14_14/0.55)]";
  }
  const resting =
    "shadow-[0_1px_0_rgb(14_14_14/0.04),0_8px_16px_-12px_rgb(14_14_14/0.35)] group-hover/chip:-translate-y-0.5 group-hover/chip:ring-ink/20 group-hover/chip:shadow-[0_1px_0_rgb(14_14_14/0.04),0_12px_20px_-12px_rgb(14_14_14/0.4)] group-active/chip:translate-y-0 group-active/chip:scale-95";
  return nudging ? cx(resting, "ring-signal/50 motion-safe:animate-[toy-nudge_1.6s_ease-in-out_infinite]") : cx(resting, "ring-line");
}

type ShelfChipProps = Readonly<{ kind: BlockKind; name: string; nudging: boolean; onAdd: (kind: BlockKind) => void }>;

/**
 * A chip on the shelf: a button that adds its block on click, Enter or Space, and a drag source for the
 * pointer and touch. Keyboard users add with the button and then move the block by its grip.
 */
function ShelfChip({ kind, name, nudging, onAdd }: ShelfChipProps): ReactNode {
  const subject: DragSubject = { source: "shelf", kind };
  const { listeners, setNodeRef, isDragging } = useDraggable({ id: `shelf-${kind}`, data: { subject } });
  const pointerListeners = Object.fromEntries(Object.entries(listeners ?? {}).filter(([event]) => event !== "onKeyDown"));

  return (
    <li className="min-w-0">
      <button
        ref={setNodeRef}
        type="button"
        {...pointerListeners}
        onClick={() => onAdd(kind)}
        className={cx("group/chip block w-full cursor-grab rounded-xl", isDragging && "opacity-40")}
      >
        <ChipFace kind={kind} name={name} nudging={nudging && !isDragging} />
      </button>
    </li>
  );
}

type BlockShelfProps = Readonly<{
  kinds: readonly BlockKind[];
  names: Readonly<Record<BlockKind, string>>;
  hint: string;
  /** The chip gently bobbing to invite a first touch, if any. */
  nudge: BlockKind | null;
  onAdd: (kind: BlockKind) => void;
  className?: string;
}>;

/** The shelf of block chips, with a line saying what to do with them. */
export function BlockShelf({ kinds, names, hint, nudge, onAdd, className }: BlockShelfProps): ReactNode {
  const hintId = useId();
  return (
    <div className={cx("flex min-w-0 flex-col gap-3", className)}>
      <p id={hintId} className="text-[12.5px] leading-snug text-ink-soft">
        {hint}
      </p>
      <ul aria-labelledby={hintId} className="grid grid-cols-4 gap-2 sm:grid-cols-2">
        {kinds.map((kind) => (
          <ShelfChip key={kind} kind={kind} name={names[kind]} nudging={nudge === kind} onAdd={onAdd} />
        ))}
      </ul>
    </div>
  );
}
