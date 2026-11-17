import { describe, expect, it } from "vitest";
import type { Timers } from "./browser";
import { Cadence } from "./Cadence";
import { GhostPresence } from "./GhostPresence";
import { TaskActions } from "./TaskActions";
import { TaskBoard } from "./TaskBoard";

describe("GhostPresence", () => {
  it("plays until the visitor comes in, and comes back a while after they leave", () => {
    const presence = new GhostPresence(4000);
    expect(presence.playing(0)).toBe(true);
    presence.enter();
    expect(presence.playing(100)).toBe(false);
    presence.leave(1000);
    expect(presence.playing(4999)).toBe(false);
    expect(presence.playing(5000)).toBe(true);
  });

  it("stays away if the visitor comes back before the wait is over", () => {
    const presence = new GhostPresence(4000);
    presence.enter();
    presence.leave(1000);
    presence.enter();
    expect(presence.playing(9000)).toBe(false);
  });

  it("refuses a negative wait", () => {
    expect(() => new GhostPresence(-1)).toThrow();
  });
});

describe("Cadence", () => {
  it("falls first after the lead-in, then once a period", () => {
    const cadence = new Cadence(1000, 300);
    expect(cadence.advance(299)).toBe(0);
    expect(cadence.advance(1)).toBe(1);
    expect(cadence.advance(999)).toBe(0);
    expect(cadence.advance(1)).toBe(1);
    expect(cadence.advance(2500)).toBe(2);
  });

  it("refuses a period of zero and time running backwards", () => {
    expect(() => new Cadence(0, 0)).toThrow();
    expect(() => new Cadence(1000, 0).advance(-1)).toThrow();
  });
});

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
