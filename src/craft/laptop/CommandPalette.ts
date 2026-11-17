import { assertNever } from "../layers/assertNever";
import type { BoardSnapshot, BoardTask, TaskBoard } from "./TaskBoard";
import type { View } from "./views";

/** A view the palette can jump to, by name. */
export type Destination = Readonly<{ name: string; view: View }>;

/** One result: a task to jump to, or a view to open. */
export type PaletteItem = Readonly<{ kind: "task"; task: BoardTask }> | Readonly<{ kind: "view"; destination: Destination }>;

/** Who opened the palette: the visitor (it takes the keyboard) or the idle ghost cursor (it does not). */
export type Opener = "visitor" | "ghost";

/** What the palette draws. A new object after every change. */
export type PaletteSnapshot = Readonly<{
  open: boolean;
  opener: Opener;
  query: string;
  /** Tasks first, then views; the query filters both. */
  items: readonly PaletteItem[];
  /** The highlighted result, or −1 when there are none. */
  active: number;
}>;

type Listener = () => void;

/**
 * The ⌘K command palette: open or closed, what has been typed, the results it finds on the board and the one
 * highlighted. Choosing a result acts on the board and closes the palette.
 */
export class CommandPalette {
  private readonly listeners = new Set<Listener>();
  private isOpen = false;
  private opener: Opener = "visitor";
  private query = "";
  private active = 0;
  private cached: PaletteSnapshot | null = null;
  private drawnFrom: BoardSnapshot | null = null;

  /** It lists at most `limits.tasks` tasks, and at most `limits.total` results in all, tasks first. */
  public constructor(
    private readonly board: TaskBoard,
    private readonly destinations: readonly Destination[],
    private readonly limits: Readonly<{ tasks: number; total: number }>,
  ) {
    if (!Number.isInteger(limits.tasks) || limits.tasks < 1 || !Number.isInteger(limits.total) || limits.total < limits.tasks) {
      throw new Error(`The palette must list at least one task, and no more tasks than results: ${JSON.stringify(limits)}`);
    }
  }

  /** Subscribes to the palette and to the board under it; returns the unsubscribe. */
  public readonly subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    const unsubscribeBoard = this.board.subscribe(listener);
    return () => {
      this.listeners.delete(listener);
      unsubscribeBoard();
    };
  };

  /** The palette as it stands. */
  public readonly snapshot = (): PaletteSnapshot => {
    const board = this.board.snapshot();
    if (this.cached === null || this.drawnFrom !== board) {
      this.drawnFrom = board;
      this.cached = this.draw();
    }
    return this.cached;
  };

  /** Opens it, empty, with the first result highlighted. */
  public open(opener: Opener): void {
    if (this.isOpen) {
      return;
    }
    this.isOpen = true;
    this.opener = opener;
    this.query = "";
    this.active = 0;
    this.changed();
  }

  /** Closes it. */
  public close(): void {
    if (!this.isOpen) {
      return;
    }
    this.isOpen = false;
    this.changed();
  }

  /** Whether it is open. */
  public opened(): boolean {
    return this.isOpen;
  }

  /** Replaces what has been typed; the first result is highlighted again. */
  public type(query: string): void {
    if (!this.isOpen || query === this.query) {
      return;
    }
    this.query = query;
    this.active = 0;
    this.changed();
  }

  /** Moves the highlight `step` results down (negative is up), wrapping round. */
  public move(step: number): void {
    const count = this.snapshot().items.length;
    if (!this.isOpen || count === 0) {
      return;
    }
    this.active = (((this.active + step) % count) + count) % count;
    this.changed();
  }

  /** Highlights the result at `index`, as the pointer passes over it. */
  public point(index: number): void {
    const count = this.snapshot().items.length;
    if (!this.isOpen || index < 0 || index >= count || index === this.active) {
      return;
    }
    this.active = index;
    this.changed();
  }

  /** Acts on the highlighted result, or the one at `index`, and closes. False if there was nothing to choose. */
  public choose(index?: number): boolean {
    const { items, active } = this.snapshot();
    const item = items[index ?? active];
    if (!this.isOpen || item === undefined) {
      return false;
    }
    this.isOpen = false;
    this.changed();
    switch (item.kind) {
      case "task":
        this.board.jumpTo(item.task.id);
        break;
      case "view":
        this.board.selectView(item.destination.view);
        break;
      default:
        assertNever(item);
    }
    return true;
  }

  private draw(): PaletteSnapshot {
    const needle = this.query.trim().toLowerCase();
    const tasks: PaletteItem[] = this.board.search(needle, this.limits.tasks).map((task) => ({ kind: "task", task }));
    const views: PaletteItem[] = this.destinations
      .filter((destination) => destination.name.toLowerCase().includes(needle))
      .map((destination) => ({ kind: "view", destination }));
    const items = [...tasks, ...views].slice(0, this.limits.total);
    const active = items.length === 0 ? -1 : Math.min(this.active, items.length - 1);
    return { open: this.isOpen, opener: this.opener, query: this.query, items, active };
  }

  private changed(): void {
    this.cached = null;
    for (const listener of this.listeners) {
      listener();
    }
  }
}
