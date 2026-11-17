import { describe, expect, it } from "vitest";
import type { Domain } from "@/content";
import { buildCapabilityIndex } from "./CapabilityIndex";

function domain(heading: string, ...toolLists: readonly (readonly string[])[]): Domain {
  return {
    label: "Capabilities",
    heading,
    intro: "",
    areas: toolLists.map((tools, index) => ({ name: `Area ${index}`, summary: "", tools })),
    repos: [],
  };
}

describe("buildCapabilityIndex", () => {
  const rows = buildCapabilityIndex([
    { chapter: "craft", domain: domain("Front end", ["A", "B", "C", "D"], ["C", "E", "F", "G", "H"]) },
    { chapter: "systems", domain: domain("Back end", ["X", "Y"]) },
    { chapter: "ai", domain: domain("AI") },
  ]);

  it("numbers the rows from 03 and carries name and chapter", () => {
    expect(rows.map((row) => [row.number, row.name, row.chapter])).toEqual([
      ["03", "Front end", "craft"],
      ["04", "Back end", "systems"],
      ["05", "AI", "ai"],
    ]);
  });

  it("previews the first six unique tools across areas, in order", () => {
    expect(rows[0].preview).toEqual(["A", "B", "C", "D", "E", "F"]);
  });

  it("keeps short and empty tool lists as they are", () => {
    expect(rows[1].preview).toEqual(["X", "Y"]);
    expect(rows[2].preview).toEqual([]);
  });
});
