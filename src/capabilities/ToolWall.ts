import type { Domain } from "@/content";

/** Decides whether a tool earns a place on the wall (the landmark shows only tools with a brand mark). */
export type ToolFilter = (tool: string) => boolean;

/**
 * The tools of every domain, dealt across a few rows for the landmark's scrolling wall. Each tool
 * appears once, and dealing round-robin mixes front end, back end and AI tools within every row.
 */
export class ToolWall {
  private constructor(private readonly dealt: readonly (readonly string[])[]) {}

  /** Collects the unique tools of `domains` in content order, keeps those `keep` accepts, and deals them into `rowCount` rows. */
  public static of(domains: readonly Domain[], rowCount: number, keep: ToolFilter): ToolWall {
    if (!Number.isInteger(rowCount) || rowCount < 1) {
      throw new RangeError(`A wall needs at least one row, not ${rowCount}`);
    }
    const unique = new Set<string>();
    for (const domain of domains) {
      for (const area of domain.areas) {
        for (const tool of area.tools) {
          unique.add(tool);
        }
      }
    }
    const rows: string[][] = Array.from({ length: rowCount }, () => []);
    Array.from(unique)
      .filter(keep)
      .forEach((tool, index) => {
        rows[index % rowCount]?.push(tool);
      });
    return new ToolWall(rows);
  }

  /** The rows, top to bottom. */
  public rows(): readonly (readonly string[])[] {
    return this.dealt;
  }
}
