"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import type { DiffLineCopy, SessionCopy } from "@/content";
import { assertNever, INK, SearchGlyph, WORD_PILL, type GlyphProps } from "@/laptop";
import { cx } from "@/ui";
import { blocksOf, type StreamBlock, type ToolRow } from "./blocks";
import { CheckGlyph, CrossGlyph, FileGlyph, FlaskGlyph, PencilGlyph, PullRequestGlyph } from "./glyphs";
import { diffStat, type StreamRow, type TestOutcome, type ToolCall, type ToolName } from "./stream";

/** How rows come in: they open from nothing, pushing the stream up smoothly. */
const EASE = [0.16, 1, 0.3, 1] as const;

/** A card on the stream: white, with a hairline edge in the app's warm brown, barely lifted. */
const CARD = "rounded-[10px] bg-white shadow-[inset_0_0_0_0.5px_rgb(60_30_15/0.16),0_1px_2px_rgb(60_30_15/0.04)]";

/** Each tool's icon. */
const TOOL_ICON: Readonly<Record<ToolName, (props: GlyphProps) => ReactNode>> = {
  read_file: FileGlyph,
  search: SearchGlyph,
  edit: PencilGlyph,
  run_tests: FlaskGlyph,
};

/** A diff line's colours: its tinted ground, its ink and its sign. */
const DIFF_LINE: Readonly<Record<DiffLineCopy["sign"], Readonly<{ ground: string; ink: string; sign: string }>>> = {
  add: { ground: "bg-[#ecf7f0]", ink: "text-[#1d6a43]", sign: "+" },
  remove: { ground: "bg-[#fdefed]", ink: "text-[#a2342f]", sign: "−" },
};

/**
 * A row that opens from nothing when it joins the stream. Rows on screen when the stream first draws (the
 * opening run, or a run shown finished at once) are simply there: the presence around them starts quiet.
 */
function Entrance({ reduced, className, children }: Readonly<{ reduced: boolean; className?: string; children: ReactNode }>): ReactNode {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      transition={reduced ? { duration: 0 } : { height: { duration: 0.42, ease: EASE }, opacity: { duration: 0.32, delay: 0.06 } }}
      className={cx("shrink-0", className)}
    >
      {children}
    </motion.div>
  );
}

/** The typing caret: a thin bar that takes no room, so the text never shifts as it types. */
function Caret(): ReactNode {
  return (
    <span aria-hidden className="relative inline-block w-0">
      <span className="absolute -top-[11px] left-[1px] h-[14px] w-[1.5px] rounded-full bg-[#ff5a1f] animate-[caret-blink_1s_steps(1)_infinite]" />
    </span>
  );
}

/**
 * Text that types itself out: the typed part shows, the rest keeps its room unseen, so the row is its full
 * height from the start and the stream does not jump as lines wrap.
 */
function Typed({ text, shown, caret }: Readonly<{ text: string; shown: number; caret: boolean }>): ReactNode {
  return (
    <>
      {text.slice(0, shown)}
      {caret ? <Caret /> : null}
      <span aria-hidden className="invisible">
        {text.slice(shown)}
      </span>
    </>
  );
}

/** The visitor's message, on the right. */
function Request({ text }: Readonly<{ text: string }>): ReactNode {
  return (
    <div className="flex justify-end pl-[60px]">
      <p className="rounded-[14px] rounded-br-[5px] bg-[#f3eeea] px-[12px] py-[7px] text-[13px] leading-[1.45] tracking-[-0.006em] shadow-[inset_0_0_0_0.5px_rgb(60_30_15/0.06)]" style={{ color: INK.strong }}>
        {text}
      </p>
    </div>
  );
}

/** The agent's plan: a few short lines it types out in turn, each with a small hollow mark. */
function Plan({ lines, typed, live }: Readonly<{ lines: readonly string[]; typed: number; live: boolean }>): ReactNode {
  const starts = lines.map((_, index) => lines.slice(0, index).reduce((sum, earlier) => sum + earlier.length, 0));
  return (
    <ul className="flex flex-col gap-[4px] pr-[12px]">
      {lines.map((line, index) => {
        const start = starts[index];
        const shown = Math.min(line.length, Math.max(0, typed - start));
        const typing = live && shown > 0 && shown < line.length;
        const waiting = shown === 0 && typed < start;
        return (
          <li key={line} className={cx("flex items-start gap-[9px] text-[13px] leading-[1.5] tracking-[-0.006em] transition-opacity duration-200", waiting && "opacity-0")} style={{ color: INK.body }}>
            <span aria-hidden className="mt-[7px] size-[5px] shrink-0 rounded-full shadow-[inset_0_0_0_1.2px_#b3aaa4]" />
            <span>
              <Typed text={line} shown={shown} caret={typing} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** A line the agent writes between calls. */
function Note({ text, typed, live }: Readonly<{ text: string; typed: number; live: boolean }>): ReactNode {
  return (
    <p className="pr-[12px] text-[13px] leading-[1.5] tracking-[-0.006em]" style={{ color: INK.body }}>
      <Typed text={text} shown={typed} caret={live && typed < text.length} />
    </p>
  );
}

/** What a call works on: the file or the search, beside its name. */
function argumentOf(call: ToolCall): string {
  switch (call.tool) {
    case "read_file":
    case "edit":
      return call.path;
    case "search":
      return `“${call.query}”`;
    case "run_tests":
      return "";
    default:
      return assertNever(call);
  }
}

/** A verdict's tint and mark. */
const VERDICT: Readonly<Record<TestOutcome["kind"], Readonly<{ tint: string; Mark: (props: GlyphProps) => ReactNode }>>> = {
  pass: { tint: "bg-[#e3f4ea] text-[#1f7a4d]", Mark: CheckGlyph },
  fail: { tint: "bg-[#ffe4e1] text-[#c8302c]", Mark: CrossGlyph },
};

/** A tiny tinted word with a mark, like the other apps' "New" and "Down". */
function Verdict({ tone, children }: Readonly<{ tone: TestOutcome["kind"]; children: ReactNode }>): ReactNode {
  const { tint, Mark } = VERDICT[tone];
  return (
    <span className={cx(WORD_PILL, "flex items-center gap-[3px] py-[3px] pl-[4px] pr-[7px]", tint)}>
      <Mark className="size-[11px]" />
      {children}
    </span>
  );
}

/** A call's result, once it is back. */
function Result({ call }: Readonly<{ call: ToolCall }>): ReactNode {
  switch (call.tool) {
    case "read_file":
    case "search":
      return <span className="text-[11.5px] font-medium tabular-nums" style={{ color: INK.muted }}>{call.result}</span>;
    case "edit": {
      const stat = diffStat(call.diff);
      return (
        <span className="flex gap-[5px] text-[11.5px] font-semibold tabular-nums">
          {stat.added > 0 ? <span className="text-[#2a8a57]">+{stat.added}</span> : null}
          {stat.removed > 0 ? <span className="text-[#c8302c]">−{stat.removed}</span> : null}
        </span>
      );
    }
    case "run_tests":
      return <Verdict tone={call.outcome.kind}>{call.outcome.result}</Verdict>;
    default:
      return assertNever(call);
  }
}

/** A small spinning ring, while a call runs. */
function Spinner({ label }: Readonly<{ label: string }>): ReactNode {
  return (
    <span className="flex items-center gap-[6px] text-[11.5px] font-medium" style={{ color: INK.faint }}>
      <span aria-hidden className="size-[11px] animate-spin rounded-full border-[1.5px] border-[rgb(60_30_15/0.14)] border-t-[#ff5a1f] motion-reduce:animate-none" />
      {label}
    </span>
  );
}

/** An edit's few changed lines, with green and red gutters. */
function Diff({ diff }: Readonly<{ diff: readonly DiffLineCopy[] }>): ReactNode {
  return (
    <div className="mx-[10px] mb-[10px] overflow-hidden rounded-[6px] py-[3px] shadow-[inset_0_0_0_0.5px_rgb(60_30_15/0.1)]">
      {diff.map((line) => {
        const look = DIFF_LINE[line.sign];
        return (
          <div key={`${line.sign}${line.code}`} className={cx("flex h-[20px] items-center font-mono text-[11px] tracking-[-0.01em]", look.ground, look.ink)}>
            <span aria-hidden className="w-[22px] shrink-0 select-none text-center opacity-70">
              {look.sign}
            </span>
            <span className="truncate whitespace-pre pr-[10px]">{line.code}</span>
          </div>
        );
      })}
    </div>
  );
}

/** One call in a card: its icon, name and what it works on, then its result once back; an edit opens its diff. */
function ToolLine({ row, copy, reduced }: Readonly<{ row: ToolRow; copy: SessionCopy; reduced: boolean }>): ReactNode {
  const Icon = TOOL_ICON[row.call.tool];
  const argument = argumentOf(row.call);
  return (
    <>
      <div className="flex h-[34px] items-center gap-[9px] pl-[9px] pr-[11px]">
        <span aria-hidden className="flex size-[22px] shrink-0 items-center justify-center rounded-[6px] bg-[rgb(60_30_15/0.055)] text-[#5d524c]">
          <Icon className="size-[14px]" />
        </span>
        <span className="flex min-w-0 flex-1 items-baseline gap-[7px] text-[12.5px] tracking-[-0.006em]">
          <span className="shrink-0 font-semibold" style={{ color: INK.strong }}>
            {row.call.tool}
          </span>
          {argument === "" ? null : (
            <span className="truncate" style={{ color: INK.muted }}>
              {argument}
            </span>
          )}
        </span>
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            key={row.done ? "done" : "running"}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.18 }}
            className="flex shrink-0 items-center"
          >
            {row.done ? <Result call={row.call} /> : <Spinner label={copy.working} />}
          </motion.span>
        </AnimatePresence>
      </div>
      {row.call.tool === "edit" ? (
        <AnimatePresence initial={false}>
          {row.done ? (
            <Entrance key="diff" reduced={reduced} className="overflow-hidden">
              <Diff diff={row.call.diff} />
            </Entrance>
          ) : null}
        </AnimatePresence>
      ) : null}
    </>
  );
}

/** Calls that follow one another, in one card with hairlines between them. */
function ToolCard({ rows, copy, reduced }: Readonly<{ rows: readonly ToolRow[]; copy: SessionCopy; reduced: boolean }>): ReactNode {
  return (
    <div className={cx(CARD, "overflow-hidden")}>
      <AnimatePresence initial={false}>
        {rows.map((row, index) => (
          <Entrance key={row.key} reduced={reduced} className={cx("overflow-hidden", index > 0 && "shadow-[inset_0_0.5px_0_rgb(60_30_15/0.09)]")}>
            <ToolLine row={row} copy={copy} reduced={reduced} />
          </Entrance>
        ))}
      </AnimatePresence>
    </div>
  );
}

/** The reviewer's comment; it greys a little and wears "Resolved" once the agent has answered it. */
function Review({ comment, resolved, copy }: Readonly<{ comment: string; resolved: boolean; copy: SessionCopy }>): ReactNode {
  return (
    <div className={cx(CARD, "px-[12px] pb-[10px] pt-[9px]")}>
      <div className="flex items-center gap-[7px]">
        <span aria-hidden className="flex size-[18px] items-center justify-center rounded-full bg-[#8d6fd6] text-[9.5px] font-semibold text-white shadow-[inset_0_0_0_0.5px_rgb(0_0_0/0.12)]">
          {copy.reviewer.slice(0, 1)}
        </span>
        <span className="text-[12px] font-semibold tracking-[-0.004em]" style={{ color: INK.strong }}>
          {copy.reviewer}
        </span>
        <AnimatePresence initial={false}>
          {resolved ? (
            <motion.span
              key="resolved"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="ml-auto"
            >
              <Verdict tone="pass">{copy.resolved}</Verdict>
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
      <p className="mt-[6px] text-[12.5px] leading-[1.45] tracking-[-0.006em] transition-colors duration-500" style={{ color: resolved ? INK.muted : INK.body }}>
        {comment}
      </p>
    </div>
  );
}

/**
 * The ending: a pull request opened, with a tick that draws itself, its number and title, and its size. Its
 * bottom margin leaves room in its row for the card's soft green shadow.
 */
function PullRequest({ row, copy, reduced }: Readonly<{ row: Extract<StreamRow, { kind: "pr" }>; copy: SessionCopy; reduced: boolean }>): ReactNode {
  const squares = 5;
  const greens = Math.round((row.added / Math.max(1, row.added + row.removed)) * squares);
  return (
    <motion.div
      initial={{ scale: 0.96, y: 6 }}
      animate={{ scale: 1, y: 0 }}
      transition={reduced ? { duration: 0 } : { duration: 0.5, ease: EASE, delay: 0.08 }}
      className="mb-[8px] flex items-center gap-[12px] rounded-[12px] bg-white py-[11px] pl-[11px] pr-[14px] shadow-[inset_0_0_0_0.5px_rgb(60_30_15/0.17),0_1px_2px_rgb(60_30_15/0.05),0_8px_20px_-10px_rgb(30_90_55/0.35)]"
    >
      <span aria-hidden className="flex size-[32px] shrink-0 items-center justify-center rounded-full bg-[linear-gradient(145deg,#45c486,#2a9d63)] text-white shadow-[inset_0_0.5px_0_rgb(255_255_255/0.4),0_1px_2px_rgb(20_90_50/0.35)]">
        <svg viewBox="0 0 16 16" className="size-[17px]">
          <motion.path
            d="m3.6 8.4 2.9 2.8 5.9-6.2"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={reduced ? { duration: 0 } : { duration: 0.45, delay: 0.3, ease: "easeOut" }}
          />
        </svg>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="text-[13.5px] font-semibold leading-none tracking-[-0.01em]" style={{ color: INK.strong }}>
          {copy.opened}
        </span>
        <span className="flex min-w-0 items-center gap-[5px] text-[12px] leading-none" style={{ color: INK.muted }}>
          <PullRequestGlyph className="size-[12px] shrink-0" />
          <span className="font-medium tabular-nums">#{row.number}</span>
          <span className="truncate">{row.title}</span>
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-[8px]">
        <span className="flex gap-[5px] text-[12px] font-semibold tabular-nums">
          <span className="text-[#2a8a57]">+{row.added}</span>
          <span className="text-[#c8302c]">−{row.removed}</span>
        </span>
        <span aria-hidden className="flex gap-[2px]">
          {Array.from({ length: squares }, (_, index) => (
            <span key={index} className={cx("size-[7px] rounded-[1.5px]", index < greens ? "bg-[#3fb37a]" : "bg-[#e5534b]")} />
          ))}
        </span>
      </span>
    </motion.div>
  );
}

/** One block of the stream, by what it holds. */
function Block({ block, copy, live, reduced }: Readonly<{ block: StreamBlock; copy: SessionCopy; live: boolean; reduced: boolean }>): ReactNode {
  if (block.kind === "tools") {
    return <ToolCard rows={block.rows} copy={copy} reduced={reduced} />;
  }
  const { row } = block;
  switch (row.kind) {
    case "request":
      return <Request text={row.text} />;
    case "plan":
      return <Plan lines={row.lines} typed={row.typed} live={live} />;
    case "note":
      return <Note text={row.text} typed={row.typed} live={live} />;
    case "review":
      return <Review comment={row.comment} resolved={row.resolved} copy={copy} />;
    case "pr":
      return <PullRequest row={row} copy={copy} reduced={reduced} />;
    default:
      return assertNever(row);
  }
}

type SessionStreamProps = Readonly<{
  copy: SessionCopy;
  rows: readonly StreamRow[];
  /** The run's number: a new run starts a fresh stream. */
  run: number;
  /** The agent is at work: carets blink on the text it types. */
  live: boolean;
  reduced: boolean;
}>;

/**
 * The session's one column, newest at the bottom. The stream is anchored to the bottom edge once it fills
 * the window, so as rows open from nothing the older ones glide up and out under a soft fade at the top;
 * while it is short it sits at the top.
 */
export function SessionStream({ copy, rows, run, live, reduced }: SessionStreamProps): ReactNode {
  const blocks = blocksOf(rows);
  return (
    <div className="relative min-h-0 flex-1">
      <div className="absolute inset-0 flex flex-col-reverse overflow-hidden">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={run}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.25 }}
            className="mb-auto flex shrink-0 flex-col pb-[14px] pl-[34px] pr-[14px] pt-[10px]"
          >
            <AnimatePresence initial={false}>
              {blocks.map((block) => (
                <Entrance key={block.key} reduced={reduced} className="overflow-hidden">
                  <div className="pb-[2px] pt-[12px]">
                    <Block block={block} copy={copy} live={live && !reduced} reduced={reduced} />
                  </div>
                </Entrance>
              ))}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[30px] bg-[linear-gradient(to_bottom,#fff,rgb(255_255_255/0))]" />
    </div>
  );
}
