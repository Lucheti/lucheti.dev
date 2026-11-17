import { describe, expect, it } from "vitest";
import type { LaptopTask } from "@/content";
import { TaskBoard } from "./TaskBoard";

const task = (id: string, overrides: Partial<LaptopTask> = {}): LaptopTask => ({
  id,
  title: `Task ${id}`,
  status: "todo",
  project: "web",
  label: "bug",
  owner: "ana",
  due: "Fri",
  ...overrides,
});

const titles = (board: TaskBoard): string[] => board.snapshot().groups.flatMap((group) => group.tasks.map((entry) => entry.id));

function makeBoard(capacity = 10): TaskBoard {
  return new TaskBoard({
    tasks: [
      task("a", { status: "doing", owner: "me" }),
      task("b"),
      task("c", { project: "site" }),
      task("d", { status: "done" }),
    ],
    incoming: [task("x", { title: "Dark mode" }), task("y")],
    me: "me",
    capacity,
  });
}

describe("TaskBoard", () => {
  it("lists every open task under In progress, then Todo, and counts each view", () => {
    const board = makeBoard();
    const snapshot = board.snapshot();
    expect(snapshot.view).toEqual({ kind: "all" });
    expect(snapshot.groups.map((group) => group.status)).toEqual(["doing", "todo"]);
    expect(titles(board)).toEqual(["a", "b", "c"]);
    expect(snapshot.counts.get("all")).toBe(3);
    expect(snapshot.counts.get("mine")).toBe(1);
    expect(snapshot.counts.get("done")).toBe(1);
    expect(snapshot.counts.get("project:web")).toBe(2);
    expect(snapshot.counts.get("project:site")).toBe(1);
  });

  it("switches views: mine, a project, and the finished list", () => {
    const board = makeBoard();
    board.selectView({ kind: "mine" });
    expect(titles(board)).toEqual(["a"]);
    board.selectView({ kind: "project", project: "site" });
    expect(titles(board)).toEqual(["c"]);
    board.selectView({ kind: "done" });
    expect(board.snapshot().groups).toEqual([{ status: "done", tasks: [expect.objectContaining({ id: "d" })] }]);
  });

  it("keeps a finished task in its row, ticked, until it settles, then lists it first under Completed", () => {
    const board = makeBoard();
    expect(board.complete("a")).toBe(true);
    const leaving = board.snapshot().groups[0].tasks[0];
    expect(leaving).toMatchObject({ id: "a", status: "done", leaving: true });
    expect(board.snapshot().counts.get("all")).toBe(2);

    board.settle("a");
    expect(titles(board)).toEqual(["b", "c"]);
    board.selectView({ kind: "done" });
    expect(titles(board)).toEqual(["a", "d"]);
  });

  it("refuses to finish a task twice, or to reopen an open one", () => {
    const board = makeBoard();
    expect(board.complete("d")).toBe(false);
    expect(board.reopen("b")).toBe(false);
    expect(board.complete("nope")).toBe(false);
  });

  it("reopens a finished task as to do", () => {
    const board = makeBoard();
    board.selectView({ kind: "done" });
    expect(board.reopen("d")).toBe(true);
    expect(titles(board)).toEqual(["d"]);
    board.settle("d");
    expect(titles(board)).toEqual([]);
    board.selectView({ kind: "all" });
    expect(titles(board)).toContain("d");
  });

  it("settles anything still leaving when the view changes", () => {
    const board = makeBoard();
    board.complete("b");
    board.selectView({ kind: "mine" });
    board.selectView({ kind: "all" });
    expect(titles(board)).toEqual(["a", "c"]);
  });

  it("assigns a task to the owner, once", () => {
    const board = makeBoard();
    expect(board.assignToMe("b")).toBe(true);
    expect(board.assignToMe("b")).toBe(false);
    expect(board.snapshot().counts.get("mine")).toBe(2);
  });

  it("brings the next task in line to the top of Todo, marked new, and clears the mark on the one before", () => {
    const board = makeBoard();
    expect(board.arrive()).toMatchObject({ id: "x", status: "todo", fresh: true });
    expect(board.snapshot().groups[1].tasks[0]).toMatchObject({ id: "x", fresh: true });
    board.arrive();
    const todo = board.snapshot().groups[1].tasks;
    expect(todo.map((entry) => [entry.id, entry.fresh])).toEqual([
      ["y", true],
      ["x", false],
      ["b", false],
      ["c", false],
    ]);
  });

  it("skips tasks still open and brings finished ones back out of the finished list", () => {
    const board = makeBoard();
    board.arrive();
    board.arrive();
    // Next in line: a (open, skipped), b (open), c (open), d (finished): d comes back.
    expect(board.arrive()?.id).toBe("d");
    expect(board.snapshot().counts.get("done")).toBe(0);
  });

  it("brings a task back with the status it was written with", () => {
    const board = makeBoard();
    board.complete("a");
    board.settle("a");
    board.arrive();
    board.arrive();
    expect(board.arrive()).toMatchObject({ id: "a", status: "doing", fresh: true });
    expect(board.snapshot().groups[0]).toMatchObject({ status: "doing", tasks: [{ id: "a" }] });
  });

  it("waits while the board is full", () => {
    const board = makeBoard(3);
    expect(board.arrive()).toBeNull();
    board.complete("a");
    expect(board.arrive()?.id).toBe("x");
  });

  it("names the task in a given row of the current view", () => {
    const board = makeBoard();
    expect(board.listed(0)).toBe("a");
    expect(board.listed(2)).toBe("c");
    expect(board.listed(3)).toBeNull();
  });

  it("finds tasks by every word of a query, open ones first", () => {
    const board = makeBoard();
    board.arrive();
    expect(board.search("dark", 5).map((entry) => entry.id)).toEqual(["x"]);
    expect(board.search("task", 5).map((entry) => entry.id)).toEqual(["a", "b", "c", "d"]);
    expect(board.search("task", 2)).toHaveLength(2);
    expect(board.search("task d", 5).map((entry) => entry.id)).toEqual(["d"]);
  });

  it("jumps to a task's project and flashes it until the next change", () => {
    const board = makeBoard();
    expect(board.jumpTo("c")).toBe(true);
    expect(board.snapshot()).toMatchObject({ view: { kind: "project", project: "site" }, spotlight: "c" });
    board.assignToMe("c");
    expect(board.snapshot().spotlight).toBeNull();
  });

  it("tells subscribers about changes and keeps the same snapshot between them", () => {
    const board = makeBoard();
    let calls = 0;
    const unsubscribe = board.subscribe(() => {
      calls += 1;
    });
    const first = board.snapshot();
    expect(board.snapshot()).toBe(first);
    board.complete("b");
    expect(calls).toBe(1);
    expect(board.snapshot()).not.toBe(first);
    unsubscribe();
    board.settle("b");
    expect(calls).toBe(1);
  });

  it("refuses duplicate ids and an empty capacity", () => {
    expect(() => new TaskBoard({ tasks: [task("a"), task("a")], incoming: [], me: "me", capacity: 3 })).toThrow();
    expect(() => new TaskBoard({ tasks: [task("a")], incoming: [], me: "me", capacity: 0 })).toThrow();
  });
});
