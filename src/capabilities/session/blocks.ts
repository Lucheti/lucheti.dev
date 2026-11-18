import type { StreamRow } from "./stream";

/** A tool call's row. */
export type ToolRow = Extract<StreamRow, { kind: "tool" }>;

/** What the stream draws: tool calls that come one after another share a card; every other row stands alone. */
export type StreamBlock = Readonly<{ kind: "tools"; key: string; rows: readonly ToolRow[] }> | Readonly<{ kind: "row"; key: string; row: Exclude<StreamRow, ToolRow> }>;

/** Groups the stream's rows into blocks, in order. A card is keyed by its first call, so it stays put as calls join it. */
export function blocksOf(rows: readonly StreamRow[]): readonly StreamBlock[] {
  const blocks: StreamBlock[] = [];
  for (const row of rows) {
    const last = blocks.at(-1);
    if (row.kind !== "tool") {
      blocks.push({ kind: "row", key: row.key, row });
    } else if (last?.kind === "tools") {
      blocks[blocks.length - 1] = { ...last, rows: [...last.rows, row] };
    } else {
      blocks.push({ kind: "tools", key: row.key, rows: [row] });
    }
  }
  return blocks;
}
