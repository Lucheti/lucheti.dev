"use client";

import { AnimatePresence } from "motion/react";
import { useRef, type KeyboardEvent, type ReactNode } from "react";
import type { Laptop } from "@/content";
import { assertNever } from "../layers/assertNever";
import { ChevronRightGlyph, DoneGlyph } from "./glyphs";
import type { Roster } from "./Roster";
import { StatusIcon } from "./StatusIcon";
import type { BoardSnapshot, BoardTask } from "./TaskBoard";
import { TaskRow } from "./TaskRow";
import type { View } from "./views";

/** The view's name, as the toolbar's breadcrumb ends. */
function titleOf(view: View, content: Laptop, roster: Roster): string {
  switch (view.kind) {
    case "mine":
      return content.views.mine;
    case "all":
      return content.views.all;
    case "done":
      return content.views.done;
    case "project":
      return roster.project(view.project).name;
    default:
      return assertNever(view);
  }
}

type TaskListProps = Readonly<{
  content: Laptop;
  roster: Roster;
  board: BoardSnapshot;
  reduced: boolean;
  onToggle: (task: BoardTask) => void;
  onAssign: (id: string) => void;
}>;

/**
 * The window's main area: a toolbar with the breadcrumb, then the view's tasks under their status headings.
 * Rows take the keyboard: arrow keys move between them, X finishes or reopens, A assigns to me.
 */
export function TaskList({ content, roster, board, reduced, onToggle, onAssign }: TaskListProps): ReactNode {
  const listRef = useRef<HTMLDivElement>(null);
  const title = titleOf(board.view, content, roster);
  const rows = board.groups.flatMap((group) => group.tasks);
  const slots = new Map(rows.map((task, index) => [task.id, index]));
  const total = rows.length;

  const onKeys = (event: KeyboardEvent<HTMLDivElement>, task: BoardTask): void => {
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }
    const focusable = [...(listRef.current?.querySelectorAll<HTMLElement>("[data-row]") ?? [])];
    const here = focusable.indexOf(event.currentTarget);
    switch (event.key) {
      case "x":
      case "X":
        event.preventDefault();
        onToggle(task);
        break;
      case "a":
      case "A":
        event.preventDefault();
        onAssign(task.id);
        break;
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        const next = focusable[here + (event.key === "ArrowDown" ? 1 : -1)];
        next?.focus();
        break;
      }
      default:
        break;
    }
  };

  return (
    <div className="absolute inset-y-0 left-[200px] right-0 flex flex-col bg-white">
      <div className="flex h-[50px] shrink-0 items-center gap-[6px] px-[18px] shadow-[inset_0_-0.5px_0_rgb(60_30_15/0.1)]">
        <span className="text-[13.5px] font-medium text-[#8a7f78]">{content.workspace}</span>
        <ChevronRightGlyph className="size-[13px] text-[#b3aaa4]" />
        <h3 className="text-[13.5px] font-semibold tracking-[-0.01em] text-[#1d1612]">{title}</h3>
        <span className="ml-[4px] rounded-full bg-[rgb(60_30_15/0.06)] px-[7px] py-[2px] text-[11.5px] font-medium tabular-nums text-[#6b615b]">{total}</span>
      </div>

      <div ref={listRef} className="relative flex-1">
        {board.groups.length === 0 ? (
          <div className="flex flex-col items-start gap-[8px] px-[22px] py-[28px] text-[13px] text-[#8a7f78]">
            <DoneGlyph className="size-[22px] text-[#c9bfb8]" />
            {content.empty}
          </div>
        ) : null}
        {board.groups.map((group) => (
          <section key={group.status} aria-label={content.statuses[group.status]}>
            <div className="flex h-[32px] items-center gap-[9px] bg-[#f8f5f2] pl-[18px] shadow-[inset_0_-0.5px_0_rgb(60_30_15/0.07)]">
              <StatusIcon status={group.status} celebrate={false} className="size-[14px]" />
              <span className="text-[12.5px] font-semibold tracking-[-0.004em] text-[#2b2320]">{content.statuses[group.status]}</span>
              <span className="text-[12px] tabular-nums text-[#958a83]">{group.tasks.length}</span>
            </div>
            <ul>
              <AnimatePresence initial={false}>
                {group.tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    slot={slots.get(task.id) ?? 0}
                    content={content}
                    roster={roster}
                    spotlit={board.spotlight === task.id}
                    reduced={reduced}
                    onToggle={onToggle}
                    onAssign={onAssign}
                    onKeys={onKeys}
                  />
                ))}
              </AnimatePresence>
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
