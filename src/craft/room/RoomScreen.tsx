"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { RoomConversation, RoomScreen as RoomScreenContent } from "@/content";
import { cx, initialsOf } from "@/ui";

type RoomScreenProps = Readonly<{
  screen: RoomScreenContent;
  /** The size it is laid out at, in CSS pixels; the scene scales it onto the monitor. */
  width: number;
  height: number;
  /** Called once it is in the DOM, so a scene that draws only on demand can lay it onto the monitor. */
  onShown: () => void;
}>;

/** The chart's bars are drawn this tall at most, in pixels. */
const CHART_HEIGHT = 96;
const OPEN_SUFFIX = "open";

/** The inbox's one piece of state: which thread is open, which are resolved and read, and the switch. */
type InboxState = Readonly<{ selected: number; resolved: ReadonlySet<number>; read: ReadonlySet<number>; autoAssign: boolean }>;

/** A conversation's row in the list: avatar, name, time, channel and a one-line preview. */
function ConversationRow({
  conversation,
  selected,
  unread,
  resolved,
  resolvedLabel,
  onSelect,
}: Readonly<{ conversation: RoomConversation; selected: boolean; unread: boolean; resolved: boolean; resolvedLabel: string; onSelect: () => void }>): ReactNode {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cx(
        "relative flex w-full gap-3.5 border-b border-line px-6 py-[18px] text-left transition-colors duration-200",
        selected ? "bg-paper" : "bg-white hover:bg-paper-raised",
      )}
    >
      {selected ? <span aria-hidden className="absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-signal" /> : null}
      <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-full bg-paper-sunk text-[14px] font-semibold text-ink-soft">
        {initialsOf(conversation.name)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className={cx("truncate text-[15px] text-ink", unread ? "font-semibold" : "font-medium")}>{conversation.name}</span>
          <span className="shrink-0 text-[13px] text-mute">{conversation.time}</span>
        </span>
        <span className="flex items-center gap-2 text-[13px] text-mute">
          {conversation.channel}
          {resolved ? <span className="rounded-full bg-paper-sunk px-2 py-px text-[12px] font-medium text-ink-soft">{resolvedLabel}</span> : null}
        </span>
        <span className="flex items-center gap-2">
          <span className="truncate text-[14px] text-ink-soft">{conversation.preview}</span>
          {unread ? <span aria-hidden className="ml-auto size-2 shrink-0 rounded-full bg-signal" /> : null}
        </span>
      </span>
    </button>
  );
}

/** A small bar chart of the week, the busiest day in orange. */
function WeekChart({ chart }: Readonly<{ chart: RoomScreenContent["chart"] }>): ReactNode {
  const top = Math.max(...chart.values);
  const busiest = chart.values.indexOf(top);
  return (
    <div className="flex flex-col gap-4 rounded-[16px] border border-line bg-white p-5">
      <div className="flex flex-col gap-1">
        <span className="text-[13px] font-medium text-mute">{chart.title}</span>
        <span className="text-[34px] font-semibold leading-none tracking-[-0.03em] text-ink">{chart.value}</span>
      </div>
      <div aria-hidden className="flex items-end justify-between gap-2" style={{ height: CHART_HEIGHT }}>
        {chart.values.map((value, day) => (
          <span
            key={`${chart.days[day]}-${day}`}
            className={cx("w-full rounded-[5px]", day === busiest ? "bg-signal" : "bg-ink/12")}
            style={{ height: `${(value / top) * 100}%` }}
          />
        ))}
      </div>
      <div aria-hidden className="flex justify-between gap-2 text-[12px] text-mute">
        {chart.days.map((day, index) => (
          <span key={`${day}-${index}`} className="w-full text-center">
            {day}
          </span>
        ))}
      </div>
      <span className="text-[13px] text-ink-soft">{chart.caption}</span>
    </div>
  );
}

/**
 * The live interface on the room's monitor: a small support inbox in the site's own style, laid out at a
 * desktop size and scaled onto the screen by the scene. It is real DOM: the conversations open, the switch
 * switches and the orange button resolves the open thread.
 */
export function RoomScreen({ screen, width, height, onShown }: RoomScreenProps): ReactNode {
  const [state, setState] = useState<InboxState>(() => ({ selected: 0, resolved: new Set(), read: new Set([0]), autoAssign: true }));
  useEffect(() => onShown(), [onShown]);
  const conversation = screen.conversations[state.selected];
  const resolved = state.resolved.has(state.selected);
  const open = screen.conversations.length - state.resolved.size;

  const select = (index: number): void =>
    setState((previous) => ({ ...previous, selected: index, read: new Set([...previous.read, index]) }));
  const toggleResolved = (): void =>
    setState((previous) => {
      const next = new Set(previous.resolved);
      if (next.has(previous.selected)) {
        next.delete(previous.selected);
      } else {
        next.add(previous.selected);
      }
      return { ...previous, resolved: next };
    });

  return (
    <div
      role="region"
      aria-label={screen.label}
      className="flex select-none overflow-hidden bg-white font-sans text-ink antialiased"
      style={{ width, height }}
    >
      <nav className="flex w-[248px] shrink-0 flex-col gap-1.5 border-r border-line bg-paper px-4 py-7">
        <div className="mb-6 flex items-center gap-3 px-2">
          <span aria-hidden className="flex size-8 items-center justify-center rounded-[9px] bg-signal">
            <span className="size-3 rounded-full border-[2.5px] border-ink" />
          </span>
          <span className="text-[16px] font-semibold tracking-[-0.01em]">{screen.workspace}</span>
        </div>
        {screen.nav.map((item, index) => (
          <span
            key={item.label}
            className={cx(
              "flex items-center justify-between rounded-[10px] px-3 py-2.5 text-[15px]",
              index === 0 ? "bg-white font-medium text-ink shadow-[0_1px_2px_rgb(14_14_14/0.08)]" : "text-ink-soft",
            )}
          >
            {item.label}
            {item.count === undefined ? null : <span className="text-[13px] text-mute">{index === 0 ? open : item.count}</span>}
          </span>
        ))}
      </nav>

      <section className="flex w-[400px] shrink-0 flex-col border-r border-line">
        <header className="flex items-baseline justify-between px-6 pb-5 pt-7">
          <span className="text-[24px] font-semibold tracking-[-0.02em]">{screen.inbox}</span>
          <span className="text-[14px] text-mute">
            {open} {OPEN_SUFFIX}
          </span>
        </header>
        <div className="flex flex-col border-t border-line">
          {screen.conversations.map((item, index) => (
            <ConversationRow
              key={item.name}
              conversation={item}
              selected={index === state.selected}
              unread={item.unread && !state.read.has(index)}
              resolved={state.resolved.has(index)}
              resolvedLabel={screen.resolved}
              onSelect={() => select(index)}
            />
          ))}
        </div>
      </section>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line px-8 py-5">
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-3 text-[20px] font-semibold tracking-[-0.015em]">
              {conversation.name}
              {resolved ? <span className="rounded-full bg-paper-sunk px-2.5 py-0.5 text-[13px] font-medium text-ink-soft">{screen.resolved}</span> : null}
            </span>
            <span className="text-[14px] text-mute">{conversation.channel}</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={state.autoAssign}
            onClick={() => setState((previous) => ({ ...previous, autoAssign: !previous.autoAssign }))}
            className="flex items-center gap-3 rounded-full py-1 pl-1 pr-1 text-[14px] font-medium text-ink-soft"
          >
            {screen.toggle}
            <span className={cx("relative h-7 w-12 rounded-full transition-colors duration-300", state.autoAssign ? "bg-ink" : "bg-ink/20")}>
              <span
                className={cx(
                  "absolute left-1 top-1 size-5 rounded-full bg-white shadow-[0_1px_2px_rgb(14_14_14/0.25)] transition-transform duration-300 ease-out-expo",
                  state.autoAssign ? "translate-x-5" : "translate-x-0",
                )}
              />
            </span>
          </button>
        </header>

        <div className="flex min-h-0 flex-1 gap-6 px-8 py-7">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            {conversation.messages.map((message, index) => (
              <p
                key={`${state.selected}-${index}`}
                className={cx(
                  "max-w-[440px] rounded-[18px] px-4 py-3 text-[15px] leading-[1.45]",
                  message.from === "them" ? "self-start rounded-bl-[6px] bg-paper-sunk/70 text-ink" : "self-end rounded-br-[6px] bg-ink text-white",
                )}
              >
                {message.text}
              </p>
            ))}
          </div>
          <aside className="w-[290px] shrink-0">
            <WeekChart chart={screen.chart} />
          </aside>
        </div>

        <footer className="flex items-center gap-3 border-t border-line px-8 py-5">
          <span className="flex-1 rounded-[12px] border border-line-strong/60 px-4 py-3 text-[15px] text-mute">{screen.composer}</span>
          <button
            type="button"
            onClick={toggleResolved}
            className="rounded-[12px] bg-signal px-6 py-3 text-[15px] font-semibold text-ink transition-transform duration-150 active:scale-[0.97]"
          >
            {resolved ? screen.action.done : screen.action.idle}
          </button>
        </footer>
      </section>
    </div>
  );
}
