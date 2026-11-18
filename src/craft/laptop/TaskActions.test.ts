import { describe, expect, it } from "vitest";
import type { Timers } from "@/laptop";
import { TaskActions } from "./TaskActions";
import { TaskBoard } from "./TaskBoard";

/** Timers run by hand. */
class ManualTimers implements Timers {
  private readonly queue = new Map<number, () => void>();
  private next = 0;

  public after(_ms: number, callback: () => void): () => void {
    const id = this.next++;
    this.queue.set(id, callback);
    return () => this.queue.delete(id);
  }

  public runAll(): void {
    for (const [id, callback] of [...this.queue]) {
      this.queue.delete(id);
      callback();
    }
  }

  public pending(): number {
    return this.queue.size;
  }
}

describe("TaskActions", () => {
  const board = (): TaskBoard =>
    new TaskBoard({
      tasks: [{ id: "a", title: "A", status: "todo", project: "p", label: "l", owner: "o", due: "Fri" }],
      incoming: [],
      me: "me",
      capacity: 5,
    });

  it("finishes a task and lets it leave the list after a beat", () => {
    const tasks = board();
    const timers = new ManualTimers();
    const actions = new TaskActions(tasks, timers, 1000);
    actions.toggle(tasks.snapshot().groups[0].tasks[0]);
    expect(tasks.listed(0)).toBe("a");
    timers.runAll();
    expect(tasks.listed(0)).toBeNull();
  });

  it("reopens a finished task through the same toggle", () => {
    const tasks = board();
    const timers = new ManualTimers();
    const actions = new TaskActions(tasks, timers, 1000);
    actions.complete("a");
    timers.runAll();
    tasks.selectView({ kind: "done" });
    actions.toggle(tasks.snapshot().groups[0].tasks[0]);
    expect(tasks.snapshot().counts.get("all")).toBe(1);
  });

  it("does not schedule anything for a change that did not happen, and cancels what is pending on dispose", () => {
    const tasks = board();
    const timers = new ManualTimers();
    const actions = new TaskActions(tasks, timers, 1000);
    actions.reopen("a");
    expect(timers.pending()).toBe(0);
    actions.complete("a");
    actions.dispose();
    expect(timers.pending()).toBe(0);
  });
});
