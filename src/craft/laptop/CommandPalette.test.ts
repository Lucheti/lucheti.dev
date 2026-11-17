import { describe, expect, it } from "vitest";
import type { LaptopTask } from "@/content";
import { CommandPalette, type Destination } from "./CommandPalette";
import { TaskBoard } from "./TaskBoard";

const task = (id: string, title: string, project = "web"): LaptopTask => ({
  id,
  title,
  status: "todo",
  project,
  label: "bug",
  owner: "ana",
  due: "Fri",
});

const DESTINATIONS: readonly Destination[] = [
  { name: "My tasks", view: { kind: "mine" } },
  { name: "Completed", view: { kind: "done" } },
  { name: "Design system", view: { kind: "project", project: "ds" } },
];

function makePalette(): { board: TaskBoard; palette: CommandPalette } {
  const board = new TaskBoard({
    tasks: [task("dark", "Dark mode"), task("date", "Date picker", "ds"), task("nav", "Navbar")],
    incoming: [],
    me: "me",
    capacity: 10,
  });
  return { board, palette: new CommandPalette(board, DESTINATIONS, { tasks: 2, total: 4 }) };
}

const names = (palette: CommandPalette): string[] =>
  palette.snapshot().items.map((item) => (item.kind === "task" ? item.task.title : item.destination.name));

describe("CommandPalette", () => {
  it("opens empty, remembers who opened it, and lists tasks then views within its limits", () => {
    const { palette } = makePalette();
    expect(palette.snapshot().open).toBe(false);
    palette.open("ghost");
    expect(palette.snapshot()).toMatchObject({ open: true, opener: "ghost", query: "", active: 0 });
    expect(names(palette)).toEqual(["Dark mode", "Date picker", "My tasks", "Completed"]);
  });

  it("filters tasks and views by what is typed", () => {
    const { palette } = makePalette();
    palette.open("visitor");
    palette.type("da");
    expect(names(palette)).toEqual(["Dark mode", "Date picker"]);
    palette.type("design");
    expect(names(palette)).toEqual(["Design system"]);
    palette.type("zzz");
    expect(palette.snapshot()).toMatchObject({ items: [], active: -1 });
  });

  it("ignores typing while closed", () => {
    const { palette } = makePalette();
    palette.type("dark");
    expect(palette.snapshot().query).toBe("");
  });

  it("moves the highlight with wrap-around, and follows the pointer", () => {
    const { palette } = makePalette();
    palette.open("visitor");
    palette.move(-1);
    expect(palette.snapshot().active).toBe(3);
    palette.move(1);
    expect(palette.snapshot().active).toBe(0);
    palette.point(2);
    expect(palette.snapshot().active).toBe(2);
    palette.point(9);
    expect(palette.snapshot().active).toBe(2);
  });

  it("jumps to a chosen task's project and closes", () => {
    const { board, palette } = makePalette();
    palette.open("visitor");
    palette.type("date");
    expect(palette.choose()).toBe(true);
    expect(palette.snapshot().open).toBe(false);
    expect(board.snapshot()).toMatchObject({ view: { kind: "project", project: "ds" }, spotlight: "date" });
  });

  it("opens a chosen view", () => {
    const { board, palette } = makePalette();
    palette.open("visitor");
    palette.choose(3);
    expect(board.snapshot().view).toEqual({ kind: "done" });
  });

  it("chooses nothing when there are no results or it is closed", () => {
    const { palette } = makePalette();
    expect(palette.choose()).toBe(false);
    palette.open("visitor");
    palette.type("zzz");
    expect(palette.choose()).toBe(false);
  });

  it("redraws when the board under it changes", () => {
    const { board, palette } = makePalette();
    palette.open("visitor");
    const before = palette.snapshot();
    let calls = 0;
    palette.subscribe(() => {
      calls += 1;
    });
    board.complete("dark");
    expect(calls).toBe(1);
    expect(palette.snapshot()).not.toBe(before);
    expect(palette.snapshot().items[0]).toMatchObject({ kind: "task", task: { id: "date" } });
  });

  it("refuses limits that list no tasks or more tasks than results", () => {
    const { board } = makePalette();
    expect(() => new CommandPalette(board, DESTINATIONS, { tasks: 0, total: 3 })).toThrow();
    expect(() => new CommandPalette(board, DESTINATIONS, { tasks: 4, total: 3 })).toThrow();
  });
});
