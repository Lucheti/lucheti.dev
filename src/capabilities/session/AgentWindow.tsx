"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import type { SessionCopy, SessionPromptId } from "@/content";
import { assertNever, AppWindowChrome, ChevronDownGlyph, ChevronRightGlyph, INK, SidebarShell, TAG_PILL, Toolbar, WINDOW_HEIGHT, type Corner } from "@/laptop";
import { cx } from "@/ui";
import type { AgentSessionParts } from "./composeAgentSession";
import { BubbleGlyph, ModelGlyph } from "./glyphs";
import { SessionStream } from "./SessionStream";
import type { SessionStatus } from "./stream";

const CORNER: Corner = { kind: "top-right" };
/** As wide as the ops app's window, so its main column fills the crop the same way and the sidebar stays off it. */
const SIZE = { width: 760, height: WINDOW_HEIGHT } as const;

/** The sidebar of past sessions, off the crop to the left. Decorative. */
function History({ copy }: Readonly<{ copy: SessionCopy }>): ReactNode {
  return (
    <SidebarShell>
      <ul aria-hidden className="flex flex-col gap-[1px]">
        {copy.history.map((title) => (
          <li key={title} className="flex h-[28px] items-center gap-[8px] rounded-[7px] px-[9px] text-[13px] text-[#3b3330]">
            <BubbleGlyph className="size-[14px] shrink-0 text-[#857a73]" />
            <span className="truncate">{title}</span>
          </li>
        ))}
      </ul>
    </SidebarShell>
  );
}

/** The status's dot and word. */
function statusLook(status: SessionStatus, copy: SessionCopy): Readonly<{ dot: string; word: string; pulse: boolean }> {
  switch (status) {
    case "running":
      return { dot: "bg-[#ff5a1f]", word: copy.status.running, pulse: true };
    case "done":
      return { dot: "bg-[#30a46c]", word: copy.status.done, pulse: false };
    case "idle":
      return { dot: "bg-[#b3aaa4]", word: copy.status.idle, pulse: false };
    default:
      return assertNever(status);
  }
}

type SessionToolbarProps = Readonly<{ copy: SessionCopy; prompt: SessionPromptId | null; status: SessionStatus; reduced: boolean }>;

/** The toolbar: the breadcrumb, then at its right end the run's status and the model. */
function SessionToolbar({ copy, prompt, status, reduced }: SessionToolbarProps): ReactNode {
  const look = statusLook(status, copy);
  return (
    <Toolbar className="pr-[14px]">
      <span className="text-[13.5px] font-medium" style={{ color: INK.muted }}>
        {copy.repo}
      </span>
      <ChevronRightGlyph className="size-[13px] text-[#b3aaa4]" />
      <h3 className="truncate text-[13.5px] font-semibold tracking-[-0.01em]" style={{ color: INK.strong }}>
        {prompt === null ? copy.untitled : copy.runs[prompt].chip}
      </h3>
      <span className="ml-auto flex shrink-0 items-center gap-[10px]">
        <span className="flex items-center gap-[6px] text-[12px] font-medium text-[#6b615b]">
          <span aria-hidden className="relative flex size-[7px]">
            {look.pulse && !reduced ? <span className={cx("absolute inset-0 animate-ping rounded-full opacity-50", look.dot)} /> : null}
            <span className={cx("relative size-[7px] rounded-full transition-colors duration-300", look.dot)} />
          </span>
          {look.word}
        </span>
        <span aria-hidden className={cx(TAG_PILL, "flex h-[26px] items-center gap-[5px] px-[9px] text-[12px] font-medium text-[#4a403b]")}>
          <ModelGlyph className="size-[13px] text-[#857a73]" />
          {copy.model}
          <ChevronDownGlyph className="size-[12px] text-[#857a73]" />
        </span>
      </span>
    </Toolbar>
  );
}

type PromptChipsProps = Readonly<{ copy: SessionCopy; current: SessionPromptId | null; onStart: (prompt: SessionPromptId) => void }>;

/** The prompt chips under the toolbar, at its right end: each starts a run, or starts its run again. */
function PromptChips({ copy, current, onStart }: PromptChipsProps): ReactNode {
  return (
    <div role="group" aria-label={copy.prompts} className="flex h-[44px] shrink-0 items-center justify-end gap-[6px] pr-[14px] shadow-[inset_0_-0.5px_0_rgb(60_30_15/0.1)]">
      {copy.order.map((prompt) => {
        const selected = prompt === current;
        return (
          <button
            key={prompt}
            type="button"
            data-ghost={`chip-${prompt}`}
            aria-pressed={selected}
            onClick={() => onStart(prompt)}
            className={cx(
              "flex h-[27px] items-center rounded-full px-[11px] text-[12px] font-medium tracking-[-0.004em] transition-[background-color,color,box-shadow,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97] data-[ghost-press]:scale-[0.97] motion-reduce:transition-none",
              selected
                ? "bg-[#1d1612] text-white shadow-[0_1px_2px_rgb(30_20_10/0.25)]"
                : cx(TAG_PILL, "text-[#4a403b] hover:bg-[#faf7f4] data-[ghost-over]:bg-[#faf7f4]"),
            )}
          >
            {copy.runs[prompt].chip}
          </button>
        );
      })}
    </div>
  );
}

type AgentWindowProps = Readonly<{
  copy: SessionCopy;
  parts: AgentSessionParts;
  reduced: boolean;
  /** The live region's last sentence. */
  message: string;
}>;

/**
 * The agent app's window, its top-right part in view: the toolbar with the session's status and model, the
 * prompt chips under it, and the session's stream filling the rest. Under reduced motion a chip shows its
 * run finished at once.
 */
export function AgentWindow({ copy, parts, reduced, message }: AgentWindowProps): ReactNode {
  const { runner } = parts;
  const view = useSyncExternalStore(runner.subscribe, runner.snapshot, runner.snapshot);
  const onStart = (prompt: SessionPromptId): void => {
    if (reduced) {
      runner.show(prompt);
    } else {
      runner.start(prompt, "visitor");
    }
  };
  return (
    <AppWindowChrome corner={CORNER} size={SIZE}>
      <History copy={copy} />
      <div className="absolute inset-y-0 left-[200px] right-0 flex flex-col bg-white">
        <SessionToolbar copy={copy} prompt={view.prompt} status={view.status} reduced={reduced} />
        <PromptChips copy={copy} current={view.prompt} onStart={onStart} />
        <SessionStream copy={copy} rows={view.rows} run={view.run} live={view.status === "running"} reduced={reduced} />
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {message}
      </p>
    </AppWindowChrome>
  );
}
