"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import type { Laptop } from "@/content";
import type { LaptopParts } from "./composeLaptop";
import { PaletteView } from "./PaletteView";
import { Sidebar } from "./Sidebar";
import { TaskList } from "./TaskList";

/** The three window buttons, in their macOS colours. Decorative: this window cannot be closed. */
function TrafficLights(): ReactNode {
  const light = "size-[12px] rounded-full shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.18)]";
  return (
    <div aria-hidden className="absolute left-[16px] top-[17px] z-10 flex gap-[8px]">
      <span className={`${light} bg-[#ff5f57]`} />
      <span className={`${light} bg-[#febc2e]`} />
      <span className={`${light} bg-[#28c840]`} />
    </div>
  );
}

type AppWindowProps = Readonly<{
  content: Laptop;
  parts: LaptopParts;
  reduced: boolean;
}>;

/**
 * The task tracker's window, its top-left part in view: traffic lights over a translucent sidebar, the task
 * list beside it, and the command palette floating over both when open.
 */
export function AppWindow({ content, parts, reduced }: AppWindowProps): ReactNode {
  const { board, palette, actions, roster } = parts;
  const boardView = useSyncExternalStore(board.subscribe, board.snapshot, board.snapshot);
  const paletteView = useSyncExternalStore(palette.subscribe, palette.snapshot, palette.snapshot);

  return (
    <div className="absolute left-[28px] top-[58px] h-[900px] w-[980px] overflow-hidden rounded-[12px] shadow-[0_0_0_0.5px_rgb(40_15_5/0.35),0_24px_60px_-6px_rgb(70_20_0/0.45),0_8px_20px_-4px_rgb(70_20_0/0.2)]">
      <TrafficLights />
      <Sidebar content={content} roster={roster} board={boardView} onSelect={(view) => board.selectView(view)} onSearch={() => palette.open("visitor")} />
      <TaskList content={content} roster={roster} board={boardView} reduced={reduced} onToggle={(task) => actions.toggle(task)} onAssign={(id) => actions.assignToMe(id)} />
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[12px] shadow-[inset_0_0.5px_0_rgb(255_255_255/0.7)]" />
      <PaletteView
        palette={paletteView}
        content={content}
        roster={roster}
        reduced={reduced}
        onClose={() => palette.close()}
        onType={(query) => palette.type(query)}
        onMove={(step) => palette.move(step)}
        onPoint={(index) => palette.point(index)}
        onChoose={(index) => palette.choose(index)}
      />
    </div>
  );
}
