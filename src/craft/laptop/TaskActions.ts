import { assertNever } from "../layers/assertNever";
import type { Timers } from "@/laptop";
import type { BoardTask, TaskBoard } from "./TaskBoard";

/**
 * What a person (or the ghost) does to a task, with the timing around it: a finished or reopened task stays
 * in its row for `lingerMs`, so the tick can be seen, and then leaves the list.
 */
export class TaskActions {
  private readonly pending = new Set<() => void>();

  public constructor(
    private readonly board: TaskBoard,
    private readonly timers: Timers,
    private readonly lingerMs: number,
  ) {
    if (!(lingerMs >= 0) || !Number.isFinite(lingerMs)) {
      throw new Error(`A task must linger zero or more ms: ${lingerMs}`);
    }
  }

  /** Finishes an open task, or reopens a finished one: what its status icon does. */
  public toggle(task: BoardTask): void {
    switch (task.status) {
      case "done":
        this.reopen(task.id);
        break;
      case "todo":
      case "doing":
        this.complete(task.id);
        break;
      default:
        assertNever(task.status);
    }
  }

  /** Finishes a task; it leaves the list after a beat. */
  public complete(id: string): void {
    if (this.board.complete(id)) {
      this.settleLater(id);
    }
  }

  /** Reopens a finished task; it leaves the finished list after a beat. */
  public reopen(id: string): void {
    if (this.board.reopen(id)) {
      this.settleLater(id);
    }
  }

  /** Gives a task to the board's owner. */
  public assignToMe(id: string): void {
    this.board.assignToMe(id);
  }

  /** Cancels the pending settles, when the panel goes away. */
  public dispose(): void {
    for (const cancel of this.pending) {
      cancel();
    }
    this.pending.clear();
  }

  private settleLater(id: string): void {
    const cancel = this.timers.after(this.lingerMs, () => {
      this.pending.delete(cancel);
      this.board.settle(id);
    });
    this.pending.add(cancel);
  }
}
