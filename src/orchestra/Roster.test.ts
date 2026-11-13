import { describe, expect, it } from "vitest";
import type { Department, OrchestraStep } from "@/content";
import { Roster } from "./Roster";

const departments: readonly Department[] = [
  { id: "product", name: "Product", agents: ["head-of-product", "product-manager"] },
  { id: "engineering", name: "Engineering", agents: ["head-of-engineering", "engineer", "reviewer"] },
  { id: "release", name: "Release", agents: ["release-manager"] },
];

const steps: readonly OrchestraStep[] = [
  { department: "product", workers: ["head-of-product"], ticket: "F-1", message: "accepted" },
  { department: "engineering", workers: ["engineer", "engineer"], ticket: "C-1", message: "two cards" },
  { department: "engineering", workers: ["engineer", "engineer", "engineer", "reviewer"], ticket: "C-1", message: "three" },
  { department: "release", workers: [], ticket: "F-1", message: "deployed" },
];

describe("Roster", () => {
  const roster = Roster.of(departments, steps);

  it("lists every agent, head first, as the roster gives them", () => {
    expect(roster.rowsOf("product").map((row) => row.id)).toEqual(["head-of-product#1", "product-manager#1"]);
  });

  it("gives an agent one row per parallel instance, at its peak", () => {
    const rows = roster.rowsOf("engineering");
    expect(rows.map((row) => row.id)).toEqual([
      "head-of-engineering#1",
      "engineer#1",
      "engineer#2",
      "engineer#3",
      "reviewer#1",
    ]);
    expect(rows[2]).toEqual({ id: "engineer#2", agent: "engineer", instance: 2, instances: 3 });
  });

  it("maps a step's workers to its rows, numbering repeats", () => {
    expect(roster.busyRows(steps[1])).toEqual(["engineer#1", "engineer#2"]);
    expect(roster.busyRows(steps[3])).toEqual([]);
  });

  it("knows which departments have a step done by code", () => {
    expect(roster.hasAutomatedStep("release")).toBe(true);
    expect(roster.hasAutomatedStep("engineering")).toBe(false);
  });

  it("numbers rows across the whole board", () => {
    expect(roster.boardIndexOf("product", "head-of-product#1")).toBe(0);
    expect(roster.boardIndexOf("engineering", "engineer#2")).toBe(4);
    expect(roster.boardIndexOf("release", "release-manager#1")).toBe(7);
    expect(roster.boardIndexOf("release", Roster.CODE_ROW)).toBe(8);
  });

  it("keeps the content order of departments and their names", () => {
    expect(roster.departmentIds()).toEqual(["product", "engineering", "release"]);
    expect(roster.nameOf("engineering")).toBe("Engineering");
  });

  it("rejects a worker who is not on the department's roster", () => {
    const stray: OrchestraStep = { department: "product", workers: ["engineer"], ticket: "F-1", message: "" };
    expect(() => Roster.of(departments, [stray])).toThrow(RangeError);
  });

  it("rejects a step in a department that does not exist", () => {
    const stray: OrchestraStep = { department: "qa", workers: [], ticket: "F-1", message: "" };
    expect(() => Roster.of(departments, [stray])).toThrow(RangeError);
  });
});
