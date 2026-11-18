"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import type { Laptop } from "@/content";
import { SearchGlyph } from "@/laptop";
import { cx } from "@/ui";
import { assertNever } from "../layers/assertNever";
import type { PaletteItem, PaletteSnapshot } from "./CommandPalette";
import { DoneGlyph, PersonGlyph, StackGlyph } from "./glyphs";
import type { Roster } from "./Roster";
import { StatusIcon } from "./StatusIcon";

/** The caret and the field's own frame show focus; the page's orange focus ring would sit on top of it. */
const NO_RING = { outline: "none" } as const;

type PaletteHandlers = Readonly<{
  onClose: () => void;
  onType: (query: string) => void;
  onMove: (step: number) => void;
  onPoint: (index: number) => void;
  onChoose: (index?: number) => void;
}>;

type PaletteViewProps = PaletteHandlers &
  Readonly<{
    palette: PaletteSnapshot;
    content: Laptop;
    roster: Roster;
    reduced: boolean;
  }>;

/** A result's icon: the task's status, or the view's own glyph. */
function iconOf(item: PaletteItem, roster: Roster): ReactNode {
  switch (item.kind) {
    case "task":
      return <StatusIcon status={item.task.status} celebrate={false} className="size-[15px]" />;
    case "view": {
      const { view } = item.destination;
      switch (view.kind) {
        case "mine":
          return <PersonGlyph className="size-[15px] text-[#7a6f69]" />;
        case "all":
          return <StackGlyph className="size-[15px] text-[#7a6f69]" />;
        case "done":
          return <DoneGlyph className="size-[15px] text-[#7a6f69]" />;
        case "project":
          return <span className="m-[2.5px] size-[10px] rounded-[3px]" style={{ backgroundColor: roster.project(view.project).colour }} />;
        default:
          return assertNever(view);
      }
    }
    default:
      return assertNever(item);
  }
}

/** A result's name, and the quiet detail on its right. */
function wordsOf(item: PaletteItem, roster: Roster): Readonly<{ name: string; detail: string }> {
  switch (item.kind) {
    case "task":
      return { name: item.task.title, detail: roster.project(item.task.project).name };
    case "view":
      return { name: item.destination.name, detail: "" };
    default:
      return assertNever(item);
  }
}

/** A key cap in the footer. */
function Key({ children }: Readonly<{ children: ReactNode }>): ReactNode {
  return (
    <kbd className="inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-[4px] bg-[rgb(60_30_15/0.06)] px-[4px] font-sans text-[10.5px] font-medium text-[#6b615b] shadow-[inset_0_-0.5px_0_rgb(60_30_15/0.15)]">
      {children}
    </kbd>
  );
}

/**
 * The ⌘K command palette, floating over the window: a search field, matching tasks and views to jump to, and
 * a footer of key hints. Arrow keys move, Return opens, Escape (or a click outside) closes.
 */
export function PaletteView({ palette, content, roster, reduced, onClose, onType, onMove, onPoint, onChoose }: PaletteViewProps): ReactNode {
  const inputRef = useRef<HTMLInputElement>(null);
  const takesKeyboard = palette.open && palette.opener === "visitor";

  // Only the visitor's palette takes the keyboard (the ghost's must never pull focus), and gives it back on close.
  useEffect(() => {
    if (!takesKeyboard) {
      return undefined;
    }
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    inputRef.current?.focus({ preventScroll: true });
    return () => before?.focus({ preventScroll: true });
  }, [takesKeyboard]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        onMove(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        onMove(-1);
        break;
      case "Enter":
        event.preventDefault();
        onChoose();
        break;
      case "Escape":
        event.preventDefault();
        onClose();
        break;
      default:
        break;
    }
  };

  const taskCount = palette.items.filter((item) => item.kind === "task").length;
  const fade = reduced ? { duration: 0 } : { duration: 0.16, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <AnimatePresence>
      {palette.open ? (
        <motion.div key="palette" className="absolute inset-0 z-30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={fade}>
          <div aria-hidden className="absolute inset-0 bg-[rgb(40_20_10/0.08)]" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-label={content.search.button}
            className="absolute left-[112px] top-[40px] w-[400px] overflow-hidden rounded-[12px] bg-white/95 shadow-[0_0_0_0.5px_rgb(40_20_10/0.16),0_18px_48px_-8px_rgb(40_20_10/0.32),0_4px_12px_rgb(40_20_10/0.08)] backdrop-blur-xl"
            initial={reduced ? false : { scale: 0.97, y: -4 }}
            animate={{ scale: 1, y: 0 }}
            exit={reduced ? undefined : { scale: 0.98, y: -2 }}
            transition={fade}
          >
            <div className="flex h-[46px] items-center gap-[10px] px-[14px] shadow-[inset_0_-0.5px_0_rgb(60_30_15/0.1)]">
              <SearchGlyph className="size-[16px] shrink-0 text-[#857a73]" />
              <span className="relative flex min-w-0 flex-1">
                {palette.opener === "ghost" ? (
                  // The ghost types without focus, so it gets a drawn caret right after its text.
                  <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-[14.5px] tracking-[-0.01em]">
                    <span className="invisible whitespace-pre">{palette.query}</span>
                    <span className="ml-px h-[17px] w-[1.5px] rounded-full bg-[#ff5a1f] motion-safe:animate-[clock-flash_1s_steps(1,end)_infinite]" />
                  </span>
                ) : null}
                <input
                  ref={inputRef}
                  value={palette.query}
                  onChange={(event) => onType(event.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={content.search.placeholder}
                  aria-label={content.search.placeholder}
                  role="combobox"
                  aria-expanded
                  aria-controls="laptop-palette-results"
                  aria-activedescendant={palette.active >= 0 ? `laptop-palette-${palette.active}` : undefined}
                  spellCheck={false}
                  style={NO_RING}
                  className="min-w-0 flex-1 bg-transparent text-[14.5px] tracking-[-0.01em] text-[#1d1612] caret-[#ff5a1f] outline-none placeholder:text-[#a69b94]"
                />
              </span>
            </div>
            <ul id="laptop-palette-results" role="listbox" className="px-[6px] py-[6px]">
              {palette.items.length === 0 ? <li className="px-[10px] py-[10px] text-[13px] text-[#8a7f78]">{content.search.empty}</li> : null}
              {palette.items.map((item, index) => {
                const words = wordsOf(item, roster);
                const heading = index === 0 && taskCount > 0 ? content.search.tasks : index === taskCount ? content.search.views : null;
                return (
                  <li key={item.kind === "task" ? `task-${item.task.id}` : `view-${item.destination.name}`} role="presentation">
                    {heading === null ? null : <p className="px-[10px] pb-[4px] pt-[6px] text-[11px] font-semibold tracking-[0.01em] text-[#958a83]">{heading}</p>}
                    <div
                      id={`laptop-palette-${index}`}
                      role="option"
                      aria-selected={index === palette.active}
                      onPointerMove={() => onPoint(index)}
                      onClick={() => onChoose(index)}
                      className={cx(
                        "flex h-[32px] cursor-default items-center gap-[10px] rounded-[7px] px-[10px] text-[13.5px]",
                        index === palette.active ? "bg-[rgb(255_90_31/0.1)] text-[#1d1612]" : "text-[#3b3330]",
                      )}
                    >
                      <span className="flex size-[15px] shrink-0 items-center justify-center">{iconOf(item, roster)}</span>
                      <span className="min-w-0 flex-1 truncate font-medium tracking-[-0.006em]">{words.name}</span>
                      {words.detail === "" ? null : <span className="shrink-0 text-[12px] text-[#958a83]">{words.detail}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="flex h-[34px] items-center gap-[14px] bg-[#faf7f4] px-[14px] text-[11.5px] text-[#857a73] shadow-[inset_0_0.5px_0_rgb(60_30_15/0.1)]">
              <span className="flex items-center gap-[5px]">
                <Key>↑</Key>
                <Key>↓</Key>
                {content.search.hints.move}
              </span>
              <span className="flex items-center gap-[5px]">
                <Key>↵</Key>
                {content.search.hints.open}
              </span>
              <span className="flex items-center gap-[5px]">
                <Key>esc</Key>
                {content.search.hints.close}
              </span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
