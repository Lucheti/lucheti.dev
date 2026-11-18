import { describe, expect, it } from "vitest";
import { SITE } from "@/content";
import { blocksOf } from "./blocks";
import { sessionPace } from "./pace";
import { RunWriter } from "./RunWriter";

describe("blocksOf", () => {
  const script = new RunWriter(SITE.ai.session.runs, sessionPace()).scriptFor("dark-mode", true);

  it("puts calls that follow one another in one card, and every other row on its own", () => {
    const blocks = blocksOf(script.rowsAt(script.duration()));
    expect(blocks.map((block) => (block.kind === "tools" ? `tools×${block.rows.length}` : block.row.kind))).toEqual([
      "request",
      "plan",
      "tools×4",
      "note",
      "tools×2",
      "review",
      "tools×1",
      "pr",
    ]);
  });

  it("keys a card by its first call, so it keeps its key as calls join it", () => {
    const rows = script.rowsAt(script.duration());
    const firstCall = rows.find((row) => row.kind === "tool");
    expect(blocksOf(rows)[2].key).toBe(firstCall?.key);
    expect(blocksOf([])).toEqual([]);
  });
});
