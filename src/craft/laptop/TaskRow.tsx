"use client";

import { motion } from "motion/react";
import type { KeyboardEvent, ReactNode } from "react";
import type { Laptop } from "@/content";
import { cx } from "@/ui";
import { AssignGlyph, CheckGlyph, UndoGlyph } from "./glyphs";
import type { Roster } from "./Roster";
import { StatusIcon } from "./StatusIcon";
import type { BoardTask } from "./TaskBoard";

/** Shows on the row's hover, keyboard focus or the ghost's hover. */
const ON_ROW_HOVER =
  "opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 group-data-[ghost-over]/row:opacity-100 group-has-[[data-ghost-over]]/row:opacity-100";
const OFF_ROW_HOVER =
  "group-hover/row:opacity-0 group-focus-within/row:opacity-0 group-data-[ghost-over]/row:opacity-0 group-has-[[data-ghost-over]]/row:opacity-0";

/** A focused row shows an orange bar on its left edge instead of the page's focus ring, which the list would clip. */
const NO_RING = { outline: "none" } as const;

/** A row's height, in the screen's pixels. */
export const ROW_HEIGHT = 40;

type RowAction = Readonly<{ label: string; hint: string; icon: ReactNode; onPress: () => void }>;

/** A small icon button in the row's hover actions, with its key in a tooltip. */
function ActionButton({ action }: Readonly<{ action: RowAction }>): ReactNode {
  return (
    <button
      type="button"
      aria-label={action.label}
      aria-keyshortcuts={action.hint}
      onClick={action.onPress}
      className="group/action relative flex size-[24px] items-center justify-center rounded-[6px] text-[#6b615b] transition-colors duration-100 hover:bg-[rgb(60_30_15/0.07)] hover:text-[#1d1612] focus-visible:outline-2 focus-visible:-outline-offset-2 motion-reduce:transition-none"
    >
      {action.icon}
      <span
        role="tooltip"
        className="pointer-events-none absolute right-[calc(100%+6px)] top-1/2 z-20 flex -translate-y-1/2 items-center gap-[6px] whitespace-nowrap rounded-[6px] bg-[#1d1612] px-[7px] py-[4px] text-[11.5px] font-medium text-white opacity-0 shadow-[0_4px_12px_rgb(0_0_0/0.18)] transition-opacity delay-0 duration-100 group-hover/action:opacity-100 group-hover/action:delay-500 motion-reduce:transition-none"
      >
        {action.label}
        <kbd className="rounded-[3px] bg-white/15 px-[4px] font-sans text-[10.5px] uppercase text-white/80">{action.hint}</kbd>
      </span>
    </button>
  );
}

type TaskRowProps = Readonly<{
  task: BoardTask;
  /** Its place in the list, from 0, for the ghost cursor to find it. */
  slot: number;
  content: Laptop;
  roster: Roster;
  spotlit: boolean;
  reduced: boolean;
  onToggle: (task: BoardTask) => void;
  onAssign: (id: string) => void;
  onKeys: (event: KeyboardEvent<HTMLDivElement>, task: BoardTask) => void;
}>;

/**
 * One task: its status (click to finish it, or to reopen a finished one), title, label, owner and due day.
 * Hovering or focusing the row swaps the due day for two actions, "Assign to me" and "Complete", each with
 * its key: X or A on the focused row does the same. A task that just arrived slides in and wears "New".
 */
export function TaskRow({ task, slot, content, roster, spotlit, reduced, onToggle, onAssign, onKeys }: TaskRowProps): ReactNode {
  const label = roster.label(task.label);
  const owner = roster.person(task.owner);
  const done = task.status === "done";
  const finishing = done && task.leaving;
  const toggleLabel = done ? content.actions.reopen : content.actions.complete;
  const actions: readonly RowAction[] = [
    { label: content.actions.assign, hint: "A", icon: <AssignGlyph className="size-[15px]" />, onPress: () => onAssign(task.id) },
    { label: toggleLabel, hint: "X", icon: done ? <UndoGlyph className="size-[15px]" /> : <CheckGlyph className="size-[15px]" />, onPress: () => onToggle(task) },
  ];
  const ease = reduced ? { duration: 0 } : { duration: 0.32, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <motion.li
      layout={reduced ? false : "position"}
      initial={reduced ? false : { opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: ROW_HEIGHT }}
      exit={{ opacity: 0, height: 0 }}
      transition={ease}
      className="relative overflow-hidden"
    >
      <div
        tabIndex={0}
        data-ghost={`row-${slot}`}
        data-row
        onKeyDown={(event) => onKeys(event, task)}
        aria-label={task.title}
        style={NO_RING}
        className={cx(
          "group/row grid h-[40px] grid-cols-[18px_166px_98px_20px_56px] items-center gap-x-[11px] pl-[16px] shadow-[inset_0_-0.5px_0_rgb(60_30_15/0.07)] outline-none transition-colors duration-150 hover:bg-[#faf7f4] focus-visible:bg-[#fbf5f0] focus-visible:shadow-[inset_2px_0_0_#ff5a1f,inset_0_-0.5px_0_rgb(60_30_15/0.07)] data-[ghost-over]:bg-[#faf7f4] has-[[data-ghost-over]]:bg-[#faf7f4] motion-reduce:transition-none",
          task.fresh && !reduced && "animate-[row-arrive_2.4s_ease-out]",
          spotlit && !reduced && "animate-[row-arrive_1.6s_ease-out]",
        )}
      >
        <button
          type="button"
          data-ghost={`status-${slot}`}
          aria-label={`${toggleLabel}: ${task.title}`}
          onClick={() => onToggle(task)}
          className="-m-[4px] flex size-[26px] items-center justify-center rounded-full transition-transform duration-150 hover:scale-110 active:scale-90 data-[ghost-press]:scale-90 focus-visible:outline-2 focus-visible:outline-offset-0 motion-reduce:transition-none"
        >
          <StatusIcon status={task.status} celebrate={finishing && !reduced} className="size-[16px]" />
        </button>

        <span className="flex min-w-0 items-center gap-[7px]">
          <span className={cx("relative min-w-0 truncate text-[13.5px] font-medium tracking-[-0.008em] transition-colors duration-300", done ? "text-[#a0958e]" : "text-[#1d1612]")}>
            {task.title}
            {finishing ? (
              <motion.span
                aria-hidden
                className="absolute inset-x-0 top-1/2 h-px origin-left bg-current"
                initial={{ scaleX: reduced ? 1 : 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: reduced ? 0 : 0.35, delay: reduced ? 0 : 0.15, ease: "easeOut" }}
              />
            ) : null}
          </span>
          {task.fresh ? (
            <span className="shrink-0 rounded-full bg-[#ffe7dc] px-[6px] py-[2px] text-[10.5px] font-semibold leading-none text-[#c2410c]">{content.fresh}</span>
          ) : null}
        </span>

        <span className="flex min-w-0 items-center gap-[6px] justify-self-start rounded-full bg-white px-[8px] py-[3px] shadow-[inset_0_0_0_0.5px_rgb(60_30_15/0.18),0_0.5px_1px_rgb(60_30_15/0.06)]">
          <span className="size-[7px] shrink-0 rounded-full" style={{ backgroundColor: label.colour }} />
          <span className="truncate text-[11.5px] font-medium leading-none text-[#4a403b]">{label.name}</span>
        </span>

        <span
          title={owner.name}
          className="flex size-[20px] items-center justify-center rounded-full text-[9px] font-semibold tracking-[0.02em] text-white shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.12)]"
          style={{ backgroundColor: owner.colour }}
        >
          {owner.initials}
        </span>

        <span className="relative flex h-full items-center">
          <span className={cx("text-[12px] tabular-nums transition-opacity duration-100", task.due === content.today && !done ? "font-medium text-[#c2410c]" : "text-[#8a7f78]", OFF_ROW_HOVER)}>
            {task.due}
          </span>
          <span className={cx("absolute inset-y-0 left-[-6px] flex items-center gap-[2px] transition-opacity duration-100 motion-reduce:transition-none", ON_ROW_HOVER)}>
            {actions.map((action) => (
              <ActionButton key={action.hint} action={action} />
            ))}
          </span>
        </span>
      </div>
    </motion.li>
  );
}
