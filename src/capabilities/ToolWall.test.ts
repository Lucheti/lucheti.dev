import { describe, expect, it } from "vitest";
import type { Domain } from "@/content";
import { ToolWall } from "./ToolWall";

function domain(...areas: (readonly string[])[]): Domain {
  return {
    heading: "Domain",
    intro: "",
    areas: areas.map((tools, index) => ({ name: `Area ${index}`, summary: "", tools })),
    repos: [],
  } as unknown as Domain;
}

const keepAll = (): boolean => true;

describe("ToolWall", () => {
  it("lists each tool once, in content order", () => {
    const wall = ToolWall.of([domain(["React", "Vite"], ["React", "Zod"])], 1, keepAll);
    expect(wall.rows()).toEqual([["React", "Vite", "Zod"]]);
  });

  it("deals tools round-robin so every row mixes domains", () => {
    const wall = ToolWall.of([domain(["React", "Vite"]), domain(["NestJS", "Redis"])], 2, keepAll);
    expect(wall.rows()).toEqual([
      ["React", "NestJS"],
      ["Vite", "Redis"],
    ]);
  });

  it("keeps only the tools the filter accepts", () => {
    const wall = ToolWall.of([domain(["React", "tool use", "Zod"])], 1, (tool) => tool !== "tool use");
    expect(wall.rows()).toEqual([["React", "Zod"]]);
  });

  it("refuses a wall without rows", () => {
    expect(() => ToolWall.of([], 0, keepAll)).toThrow(RangeError);
  });
});
