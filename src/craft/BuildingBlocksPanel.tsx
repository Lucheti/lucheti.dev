"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
  type Active,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
  type Over,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { BlockKind, BuildingBlocksPanel as BuildingBlocksContent } from "@/content";
import { FeaturePanel, usePanelLoop } from "@/ui";
import { BlockAnnouncer } from "./blocks/BlockAnnouncer";
import { blockFootprint, CARD_ROOM, SHELF_ORDER } from "./blocks/blockFootprint";
import { BlockShelf, ChipFace } from "./blocks/BlockShelf";
import { CardBlockView } from "./blocks/CardBlocks";
import { CardLayout, type CardBlock, type LayoutChange } from "./blocks/CardLayout";
import { DropPlanner, isDragSubject, type DragSubject, type DropTarget } from "./blocks/DropPlanner";
import { CARD_ID, PhoneCard } from "./blocks/PhoneCard";
import { SortableBlock } from "./blocks/SortableBlock";

/** How long each shelf chip bobs before the next takes over, until the visitor plays. */
const NUDGE_MS = 1800;
/** How long the "no room" toast stays. */
const NOTICE_MS = 2200;
/** A click that lands this soon after a drag ends belongs to the drag, not to the chip. */
const CLICK_AFTER_DRAG_MS = 250;

const MOUSE = { activationConstraint: { distance: 6 } } as const;
const TOUCH = { activationConstraint: { delay: 160, tolerance: 8 } } as const;

type DragState = Readonly<{ subject: DragSubject; target: DropTarget }>;
type Spoken = Readonly<{ text: string; serial: number }>;

/**
 * Over the card, the closest block (or the card itself when it is empty); anywhere else, nothing, which
 * takes a dragged block off. The keyboard has no pointer, so it always gets the closest block.
 */
const collide: CollisionDetection = (args) => {
  const blocks = args.droppableContainers.filter((container) => container.id !== CARD_ID);
  if (args.pointerCoordinates === null) {
    return closestCenter({ ...args, droppableContainers: blocks });
  }
  const onCard = pointerWithin(args).filter((collision) => collision.id === CARD_ID);
  if (onCard.length === 0) {
    return [];
  }
  const closest = closestCenter({ ...args, droppableContainers: blocks });
  return closest.length > 0 ? closest : onCard;
};

function subjectOf(active: Active): DragSubject | null {
  const subject: unknown = active.data.current?.subject;
  return isDragSubject(subject) ? subject : null;
}

function sameTarget(a: DropTarget, b: DropTarget): boolean {
  if (a.zone === "block" && b.zone === "block") {
    return a.id === b.id && a.after === b.after;
  }
  return a.zone === b.zone;
}

function subscribeToNothing(): () => void {
  return () => undefined;
}

/**
 * The front end's feature panel, "Building blocks": a tiny UI builder. Chips on a shelf drag (or tap)
 * onto a phone card, where the blocks reorder by their grips and come off by their × or by being dragged
 * away. The card has a fixed room; a block that doesn't fit is refused with a shake. Until the visitor
 * plays, one chip at a time bobs, only while the panel is on screen and motion is allowed.
 *
 * The composition root of the toy: the layout, the drop planner and the announcer are made here, once.
 */
export function BuildingBlocksPanel({ panel }: Readonly<{ panel: BuildingBlocksContent }>): ReactNode {
  const rootRef = useRef<HTMLDivElement>(null);
  const running = usePanelLoop(rootRef);
  const reduced = useReducedMotion() === true;
  const dndId = useId();
  const mounted = useSyncExternalStore(subscribeToNothing, () => true, () => false);

  const [planner] = useState(() => new DropPlanner());
  const [announcer] = useState(() => new BlockAnnouncer(panel.names, panel.messages));
  const [layout, setLayout] = useState(() =>
    CardLayout.create({ starter: panel.starter, room: CARD_ROOM, footprint: blockFootprint }),
  );
  const [drag, setDrag] = useState<DragState | null>(null);
  const [spoken, setSpoken] = useState<Spoken>({ text: "", serial: 0 });
  const [notice, setNotice] = useState<Spoken | null>(null);
  const [shakes, setShakes] = useState(0);
  const [touched, setTouched] = useState(false);
  const [settling, setSettling] = useState(false);
  const [instantExit, setInstantExit] = useState(false);
  const [tick, setTick] = useState(0);
  const dragEndedAt = useRef(Number.NEGATIVE_INFINITY);

  const sensors = useSensors(
    useSensor(MouseSensor, MOUSE),
    useSensor(TouchSensor, TOUCH),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const idle = running && !touched && drag === null;
  useEffect(() => {
    if (!idle) {
      return undefined;
    }
    const timer = window.setInterval(() => setTick((count) => count + 1), NUDGE_MS);
    return () => window.clearInterval(timer);
  }, [idle]);

  useEffect(() => {
    if (!settling) {
      return undefined;
    }
    const frame = window.requestAnimationFrame(() => setSettling(false));
    return () => window.cancelAnimationFrame(frame);
  }, [settling]);

  useEffect(() => {
    if (notice === null) {
      return undefined;
    }
    const timer = window.setTimeout(() => setNotice(null), NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const commit = (change: LayoutChange, viaDrag: boolean): void => {
    setTouched(true);
    setLayout(change.layout);
    setInstantExit(viaDrag && change.kind === "removed");
    setSettling(viaDrag && change.kind === "moved");
    const said = announcer.describe(change);
    if (said === null) {
      return;
    }
    setSpoken((last) => ({ text: said, serial: last.serial + 1 }));
    if (change.kind === "refused") {
      setShakes((count) => count + 1);
      setNotice((last) => ({ text: said, serial: (last?.serial ?? 0) + 1 }));
    }
  };

  const targetOf = (active: Active, over: Over | null): DropTarget => {
    if (over === null) {
      return { zone: "away" };
    }
    if (over.id === CARD_ID) {
      return { zone: "card" };
    }
    const id = String(over.id);
    if (layout.indexOf(id) === -1) {
      return { zone: "away" };
    }
    const box = active.rect.current.translated;
    const after = box !== null && planner.isAfter(box.top + box.height / 2, over.rect.top, over.rect.height);
    return { zone: "block", id, after };
  };

  const onDragStart = ({ active }: DragStartEvent): void => {
    const subject = subjectOf(active);
    if (subject === null) {
      return;
    }
    setTouched(true);
    setDrag({ subject, target: subject.source === "card" ? { zone: "block", id: subject.id, after: false } : { zone: "away" } });
  };

  const onDragMove = ({ active, over }: DragMoveEvent): void => {
    const target = targetOf(active, over);
    setDrag((current) => (current === null || sameTarget(current.target, target) ? current : { ...current, target }));
  };

  const onDragEnd = ({ active, over }: DragEndEvent): void => {
    setDrag(null);
    dragEndedAt.current = performance.now();
    const subject = subjectOf(active);
    if (subject === null) {
      return;
    }
    commit(planner.apply(planner.plan(subject, targetOf(active, over), layout), layout), true);
  };

  const onDragCancel = (): void => {
    setDrag(null);
    dragEndedAt.current = performance.now();
  };

  const addFromShelf = (kind: BlockKind): void => {
    if (performance.now() - dragEndedAt.current < CLICK_AFTER_DRAG_MS) {
      return;
    }
    commit(layout.add(kind), false);
  };

  const spokenFor = (active: Active, say: (subject: DragSubject) => string | undefined): string | undefined => {
    const subject = subjectOf(active);
    return subject === null ? undefined : say(subject);
  };

  const announcements: Announcements = {
    onDragStart: ({ active }) => spokenFor(active, (subject) => announcer.pickedUp(subject, layout)),
    onDragOver: ({ active, over }) => spokenFor(active, (subject) => announcer.over(subject, targetOf(active, over), layout)),
    onDragEnd: () => undefined,
    onDragCancel: ({ active }) => spokenFor(active, (subject) => announcer.cancelled(subject, layout)),
  };

  const shelfKind = drag?.subject.source === "shelf" ? drag.subject.kind : null;
  const receiving = shelfKind !== null && drag?.target.zone !== "away";
  const suggestions = layout.suggestions(SHELF_ORDER);
  const nudge = idle && suggestions.length > 0 ? suggestions[tick % suggestions.length] : null;

  const renderBlock = (block: CardBlock): ReactNode => (
    <SortableBlock
      block={block}
      handleLabel={announcer.labelFor(panel.handle, block.kind)}
      removeLabel={announcer.labelFor(panel.remove, block.kind)}
      away={drag?.subject.source === "card" && drag.subject.id === block.id && drag.target.zone === "away"}
      still={reduced}
      onRemove={() => commit(layout.remove(block.id), false)}
    >
      <CardBlockView kind={block.kind} copy={panel.copy} />
    </SortableBlock>
  );

  const reset = (
    <button
      type="button"
      onClick={() => commit(layout.reset(), false)}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium text-ink-soft ring-1 ring-inset ring-line transition-[color,box-shadow,transform] duration-200 ease-out-expo hover:text-ink hover:ring-ink/25 active:scale-95 motion-reduce:transition-none"
    >
      <svg aria-hidden viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8a5 5 0 1 0 1.6-3.7" />
        <path d="M3 2.5v2.8h2.8" />
      </svg>
      {panel.reset}
    </button>
  );

  return (
    <FeaturePanel label={panel.label} title={panel.title} aside={reset}>
      <div ref={rootRef} className="flex min-w-0 flex-1 flex-col gap-5 sm:flex-row sm:gap-6">
        <DndContext
          id={dndId}
          sensors={sensors}
          collisionDetection={collide}
          autoScroll={false}
          accessibility={{ announcements, screenReaderInstructions: { draggable: panel.messages.instructions } }}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragOver={onDragMove}
          onDragEnd={onDragEnd}
          onDragCancel={onDragCancel}
        >
          <BlockShelf
            kinds={SHELF_ORDER}
            names={panel.names}
            hint={panel.hint}
            nudge={nudge}
            onAdd={addFromShelf}
            className="sm:w-40 sm:shrink-0"
          />
          <PhoneCard
            label={panel.card}
            blocks={layout.blocks()}
            insertAt={drag === null ? null : planner.insertionIndex(drag.subject, drag.target, layout)}
            receiving={receiving}
            full={shelfKind !== null && !layout.fits(shelfKind)}
            shakes={shakes}
            still={reduced || settling}
            instantExit={instantExit}
            renderBlock={renderBlock}
            notice={notice?.text ?? null}
          />
          {mounted
            ? createPortal(
                <DragOverlay dropAnimation={null} zIndex={60}>
                  {shelfKind !== null ? <ChipFace kind={shelfKind} name={panel.names[shelfKind]} lifted /> : null}
                </DragOverlay>,
                document.body,
              )
            : null}
        </DndContext>
        <div aria-live="polite" className="sr-only">
          <p key={spoken.serial}>{spoken.text}</p>
        </div>
      </div>
    </FeaturePanel>
  );
}
