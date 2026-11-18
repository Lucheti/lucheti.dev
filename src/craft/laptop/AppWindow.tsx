"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import type { Laptop } from "@/content";
import { AppWindowChrome, WINDOW_HEIGHT, type Corner } from "@/laptop";
import type { LaptopParts } from "./composeLaptop";
import { PaletteView } from "./PaletteView";
import { Sidebar } from "./Sidebar";
import { TaskList } from "./TaskList";

const CORNER: Corner = { kind: "top-left" };
const SIZE = { width: 980, height: WINDOW_HEIGHT } as const;

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
    <AppWindowChrome corner={CORNER} size={SIZE}>
      <Sidebar content={content} roster={roster} board={boardView} onSelect={(view) => board.selectView(view)} onSearch={() => palette.open("visitor")} />
      <TaskList content={content} roster={roster} board={boardView} reduced={reduced} onToggle={(task) => actions.toggle(task)} onAssign={(id) => actions.assignToMe(id)} />
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
    </AppWindowChrome>
  );
}
