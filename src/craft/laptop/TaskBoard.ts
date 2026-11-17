import type { LaptopTask, TaskStatus } from "@/content";
import { assertNever } from "../layers/assertNever";
import { viewKey, type View, type ViewKey } from "./views";

/** A task as the list draws it. */
export type BoardTask = Readonly<
  LaptopTask & {
    /** It has just arrived and wears the "new" mark until the next one does. */
    fresh: boolean;
    /** It has just changed sides (finished or reopened) and stays where it was until it settles. */
    leaving: boolean;
  }
>;

/** The tasks under one status heading, in list order. */
export type TaskGroup = Readonly<{ status: TaskStatus; tasks: readonly BoardTask[] }>;

/** What the list and the sidebar draw. A new object after every change, so React can compare it. */
export type BoardSnapshot = Readonly<{
  view: View;
  /** The current view's tasks under their headings; empty groups are left out. */
  groups: readonly TaskGroup[];
  /** Open tasks per view; for the "done" view, finished ones. */
  counts: ReadonlyMap<ViewKey, number>;
  /** The task a palette jump landed on, flashed once; cleared by the next change. */
  spotlight: string | null;
}>;

/** How the board is set up. */
export type BoardSetup = Readonly<{
  /** The tasks on screen at first. */
  tasks: readonly LaptopTask[];
  /** The line of tasks that arrive; once it runs out, it starts again, skipping any still open. */
  incoming: readonly LaptopTask[];
  /** Whose tasks "My tasks" shows. */
  me: string;
  /** The most open tasks there can be; an arrival waits while the board is full. */
  capacity: number;
}>;

type Entry = {
  task: LaptopTask;
  fresh: boolean;
  leaving: boolean;
  /** The heading it is listed under in the open views; for a finished task that is still leaving, its old status. */
  shelf: TaskStatus;
  /** When it was finished, in board changes, so the newest finished task lists first. */
  finished: number;
};

type Listener = () => void;

/** The headings of the open views, top to bottom. */
const OPEN_SHELVES: readonly TaskStatus[] = ["doing", "todo"];

/**
 * The task tracker's state: which view is selected, every task and where it stands, and the line of tasks
 * still to arrive. The list, the sidebar, the command palette and the ghost cursor all act through its
 * domain methods; React reads `snapshot` through `useSyncExternalStore`.
 */
export class TaskBoard {
  private readonly entries: Entry[];
  private readonly line: readonly LaptopTask[];
  private readonly me: string;
  private readonly capacity: number;
  private readonly listeners = new Set<Listener>();
  private view: View = { kind: "all" };
  private spotlit: string | null = null;
  private nextInLine = 0;
  private changes = 0;
  private cached: BoardSnapshot | null = null;

  public constructor(setup: BoardSetup) {
    const ids = [...setup.tasks, ...setup.incoming].map((task) => task.id);
    if (new Set(ids).size !== ids.length) {
      throw new Error(`Every task needs its own id: ${ids.join(", ")}`);
    }
    if (!Number.isInteger(setup.capacity) || setup.capacity < 1) {
      throw new Error(`The board must hold at least one open task: ${setup.capacity}`);
    }
    this.entries = setup.tasks.map((task, index) => ({
      task,
      fresh: false,
      leaving: false,
      shelf: task.status === "done" ? "todo" : task.status,
      finished: task.status === "done" ? -index - 1 : 0,
    }));
    this.line = [...setup.incoming, ...setup.tasks];
    this.me = setup.me;
    this.capacity = setup.capacity;
  }

  /** Subscribes to changes; returns the unsubscribe. */
  public readonly subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** The board as it stands. */
  public readonly snapshot = (): BoardSnapshot => {
    this.cached ??= this.draw();
    return this.cached;
  };

  /** Shows another view. Anything still leaving the old one settles at once. */
  public selectView(view: View): void {
    if (viewKey(view) === viewKey(this.view)) {
      return;
    }
    this.view = view;
    for (const entry of this.entries) {
      entry.leaving = false;
    }
    this.changed();
  }

  /** Finishes an open task. It stays in its row, ticked, until `settle`. False if it is not open. */
  public complete(id: string): boolean {
    const entry = this.find(id);
    if (entry === undefined || entry.task.status === "done") {
      return false;
    }
    entry.shelf = entry.task.status;
    entry.task = { ...entry.task, status: "done" };
    entry.leaving = true;
    entry.fresh = false;
    entry.finished = this.changes + 1;
    this.changed();
    return true;
  }

  /** Puts a finished task back to do. It stays in the finished list until `settle`. False if it is not finished. */
  public reopen(id: string): boolean {
    const entry = this.find(id);
    if (entry === undefined || entry.task.status !== "done") {
      return false;
    }
    entry.task = { ...entry.task, status: "todo" };
    entry.shelf = "todo";
    entry.leaving = true;
    this.changed();
    return true;
  }

  /** A task that changed sides leaves the list it was in. */
  public settle(id: string): void {
    const entry = this.find(id);
    if (entry === undefined || !entry.leaving) {
      return;
    }
    entry.leaving = false;
    this.changed();
  }

  /** Gives a task to the board's owner. False if it is theirs already. */
  public assignToMe(id: string): boolean {
    const entry = this.find(id);
    if (entry === undefined || entry.task.owner === this.me) {
      return false;
    }
    entry.task = { ...entry.task, owner: this.me };
    this.changed();
    return true;
  }

  /**
   * The next task in line arrives at the top of its heading (with the status it was written with; to do if
   * that was done), marked new. A task still open is skipped; a finished one comes back out of the finished
   * list. Returns the task, or null while the board is full.
   */
  public arrive(): BoardTask | null {
    if (this.openCount() >= this.capacity) {
      return null;
    }
    for (let tries = 0; tries < this.line.length; tries += 1) {
      const template = this.line[this.nextInLine];
      this.nextInLine = (this.nextInLine + 1) % this.line.length;
      const existing = this.entries.findIndex((entry) => entry.task.id === template.id);
      if (existing !== -1 && this.isOpen(this.entries[existing])) {
        continue;
      }
      if (existing !== -1) {
        this.entries.splice(existing, 1);
      }
      for (const entry of this.entries) {
        entry.fresh = false;
      }
      const status = TaskBoard.reopened(template.status);
      const entry: Entry = { task: { ...template, status }, fresh: true, leaving: false, shelf: status, finished: 0 };
      this.entries.unshift(entry);
      this.changed();
      return TaskBoard.toTask(entry);
    }
    return null;
  }

  /** Jumps to a task: shows its project and flashes its row. False if there is no such task. */
  public jumpTo(id: string): boolean {
    const entry = this.find(id);
    if (entry === undefined) {
      return false;
    }
    this.view = entry.task.status === "done" ? { kind: "done" } : { kind: "project", project: entry.task.project };
    for (const other of this.entries) {
      other.leaving = false;
    }
    this.changed(id);
    return true;
  }

  /** The id of the task in the `slot`th row of the current view, counting from 0 down the list; null past the end. */
  public listed(slot: number): string | null {
    const rows = this.snapshot().groups.flatMap((group) => group.tasks);
    return rows[slot]?.id ?? null;
  }

  /** Tasks whose title holds every word of `query`, open ones first, at most `limit`. Every task for an empty query. */
  public search(query: string, limit: number): readonly BoardTask[] {
    const words = query.toLowerCase().split(/\s+/).filter((word) => word.length > 0);
    const matches = this.entries.filter((entry) => {
      const title = entry.task.title.toLowerCase();
      return words.every((word) => title.includes(word));
    });
    const open = matches.filter((entry) => entry.task.status !== "done");
    const done = matches.filter((entry) => entry.task.status === "done");
    return [...open, ...done].slice(0, limit).map(TaskBoard.toTask);
  }

  private draw(): BoardSnapshot {
    const counts = new Map<ViewKey, number>();
    const open = this.entries.filter((entry) => entry.task.status !== "done");
    counts.set("mine", open.filter((entry) => entry.task.owner === this.me).length);
    counts.set("all", open.length);
    counts.set("done", this.entries.length - open.length);
    for (const entry of open) {
      const key = viewKey({ kind: "project", project: entry.task.project });
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return { view: this.view, groups: this.groupsOf(this.view), counts, spotlight: this.spotlit };
  }

  private groupsOf(view: View): readonly TaskGroup[] {
    switch (view.kind) {
      case "done": {
        const finished = this.entries
          .filter((entry) => this.listedAsDone(entry))
          .sort((a, b) => b.finished - a.finished)
          .map(TaskBoard.toTask);
        return finished.length === 0 ? [] : [{ status: "done", tasks: finished }];
      }
      case "mine":
      case "all":
      case "project":
        return OPEN_SHELVES.map((status) => ({
          status,
          tasks: this.entries
            .filter((entry) => this.isOpen(entry) && entry.shelf === status && TaskBoard.belongs(entry, view, this.me))
            .map(TaskBoard.toTask),
        })).filter((group) => group.tasks.length > 0);
      default:
        return assertNever(view);
    }
  }

  /** Listed in the open views: not finished, or finished a moment ago and still leaving. */
  private isOpen(entry: Entry): boolean {
    return entry.task.status !== "done" || entry.leaving;
  }

  /** Listed under "Completed": finished, or reopened a moment ago and still leaving. */
  private listedAsDone(entry: Entry): boolean {
    return entry.task.status === "done" ? !entry.leaving : entry.leaving;
  }

  private openCount(): number {
    return this.entries.filter((entry) => entry.task.status !== "done").length;
  }

  private find(id: string): Entry | undefined {
    return this.entries.find((entry) => entry.task.id === id);
  }

  /** Records a change and tells the listeners; `spotlight` is the row to flash, if the change was a jump. */
  private changed(spotlight: string | null = null): void {
    this.changes += 1;
    this.spotlit = spotlight;
    this.cached = null;
    for (const listener of this.listeners) {
      listener();
    }
  }

  private static belongs(entry: Entry, view: Exclude<View, { kind: "done" }>, me: string): boolean {
    switch (view.kind) {
      case "mine":
        return entry.task.owner === me;
      case "all":
        return true;
      case "project":
        return entry.task.project === view.project;
      default:
        return assertNever(view);
    }
  }

  /** The status a task comes back with: as it was written, except that a finished one is to do again. */
  private static reopened(status: TaskStatus): TaskStatus {
    switch (status) {
      case "done":
        return "todo";
      case "todo":
      case "doing":
        return status;
      default:
        return assertNever(status);
    }
  }

  private static toTask(entry: Entry): BoardTask {
    return { ...entry.task, fresh: entry.fresh, leaving: entry.leaving };
  }
}
