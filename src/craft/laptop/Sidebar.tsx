"use client";

import type { ReactNode } from "react";
import type { Laptop } from "@/content";
import { ChevronDownGlyph, PRESSABLE, SearchGlyph, SidebarShell } from "@/laptop";
import { cx } from "@/ui";
import { ComposeGlyph, DoneGlyph, PersonGlyph, StackGlyph } from "./glyphs";
import type { Roster } from "./Roster";
import type { BoardSnapshot } from "./TaskBoard";
import { viewKey, type View, type ViewKey } from "./views";

type NavItemProps = Readonly<{
  view: View;
  label: string;
  count: number | null;
  selected: boolean;
  icon: ReactNode;
  onSelect: (view: View) => void;
}>;

/** One view in the sidebar: an icon, its name and how many open tasks it holds. */
function NavItem({ view, label, count, selected, icon, onSelect }: NavItemProps): ReactNode {
  return (
    <li>
      <button
        type="button"
        data-ghost={`view-${viewKey(view)}`}
        aria-current={selected ? "page" : undefined}
        onClick={() => onSelect(view)}
        className={cx(
          "flex h-[28px] w-full items-center gap-[9px] rounded-[7px] px-[9px] text-left text-[13px] tracking-[-0.006em] focus-visible:outline-2 focus-visible:-outline-offset-2",
          selected ? "bg-[rgb(60_30_15/0.085)] font-medium text-[#1d1612]" : cx("text-[#3b3330]", PRESSABLE),
        )}
      >
        <span className={cx("flex size-[16px] shrink-0 items-center justify-center", selected ? "text-[#1d1612]" : "text-[#7a6f69]")}>{icon}</span>
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {count === null ? null : <span className="text-[12px] tabular-nums text-[#857a73]">{count}</span>}
      </button>
    </li>
  );
}

type SidebarProps = Readonly<{
  content: Laptop;
  roster: Roster;
  board: BoardSnapshot;
  onSelect: (view: View) => void;
  onSearch: () => void;
}>;

/**
 * The window's sidebar, translucent over the desktop the way macOS sidebars are: the workspace switcher,
 * the search button (⌘K), the views with their counts, and the projects.
 */
export function Sidebar({ content, roster, board, onSelect, onSearch }: SidebarProps): ReactNode {
  const current = viewKey(board.view);
  const countOf = (key: ViewKey): number => board.counts.get(key) ?? 0;
  return (
    <SidebarShell>
      <div className="flex items-center justify-between pl-[4px]">
        <div className="flex min-w-0 items-center gap-[8px] rounded-[7px] py-[4px] pl-[3px] pr-[6px]">
          <span className="flex size-[20px] shrink-0 items-center justify-center rounded-[6px] bg-[linear-gradient(145deg,#ff8a4c,#ff5a1f_55%,#e2430f)] text-[11px] font-semibold text-white shadow-[inset_0_0.5px_0_rgb(255_255_255/0.4),0_0.5px_1px_rgb(120_40_10/0.4)]">
            {content.workspace.slice(0, 1)}
          </span>
          <span className="truncate text-[13.5px] font-semibold tracking-[-0.01em] text-[#1d1612]">{content.workspace}</span>
          <ChevronDownGlyph className="size-[13px] shrink-0 text-[#857a73]" />
        </div>
        <span aria-hidden className="flex size-[26px] items-center justify-center rounded-[7px] text-[#5d524c]">
          <ComposeGlyph className="size-[16px]" />
        </span>
      </div>

      <button
        type="button"
        data-ghost="search"
        onClick={onSearch}
        aria-keyshortcuts="Meta+K"
        className={cx(
          "mt-[10px] flex h-[28px] items-center gap-[8px] rounded-[7px] bg-[rgb(60_30_15/0.05)] px-[9px] text-left text-[13px] text-[#7a6f69] shadow-[inset_0_0_0_0.5px_rgb(60_30_15/0.08)] focus-visible:outline-2 focus-visible:-outline-offset-2",
          PRESSABLE,
        )}
      >
        <SearchGlyph className="size-[15px] shrink-0" />
        <span className="flex-1">{content.search.button}</span>
        <kbd className="font-sans text-[11.5px] tracking-[0.04em] text-[#9a8f88]">⌘K</kbd>
      </button>

      <nav aria-label={content.app} className="mt-[14px]">
        <ul className="flex flex-col gap-[1px]">
          <NavItem view={{ kind: "mine" }} label={content.views.mine} count={countOf("mine")} selected={current === "mine"} icon={<PersonGlyph className="size-[16px]" />} onSelect={onSelect} />
          <NavItem view={{ kind: "all" }} label={content.views.all} count={countOf("all")} selected={current === "all"} icon={<StackGlyph className="size-[16px]" />} onSelect={onSelect} />
          <NavItem view={{ kind: "done" }} label={content.views.done} count={null} selected={current === "done"} icon={<DoneGlyph className="size-[16px]" />} onSelect={onSelect} />
        </ul>
        <p className="mb-[4px] mt-[18px] px-[9px] text-[11.5px] font-semibold tracking-[0.005em] text-[#8a7f78]">{content.views.projects}</p>
        <ul className="flex flex-col gap-[1px]">
          {roster.projects().map((project) => {
            const view: View = { kind: "project", project: project.id };
            const key = viewKey(view);
            return (
              <NavItem
                key={project.id}
                view={view}
                label={project.name}
                count={countOf(key)}
                selected={current === key}
                icon={<span className="size-[10px] rounded-[3px] shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.15)]" style={{ backgroundColor: project.colour }} />}
                onSelect={onSelect}
              />
            );
          })}
        </ul>
      </nav>
    </SidebarShell>
  );
}
