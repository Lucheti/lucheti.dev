"use client";

import { useEffect, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import type { DioramaScreen as DioramaScreenContent, ScreenTask } from "@/content";
import { cx } from "@/ui";
import type { Density, DioramaState, Theme } from "./DioramaState";
import { STAR_COUNT } from "./Target";

type ScreenProps = Readonly<{
  screen: DioramaScreenContent;
  state: DioramaState;
  /** The size it is laid out at, in CSS pixels; the scene scales it onto the monitor. */
  width: number;
  height: number;
  /** Called once it is in the DOM, so a scene that draws only on demand can lay it onto the monitor. */
  onShown: () => void;
}>;

/** A row's size at each density: its text, its avatar, and the space round it, in CSS pixels. */
const SIZES: Readonly<Record<Density, Readonly<{ text: number; avatar: number; pad: number; star: number }>>> = {
  snug: { text: 8, avatar: 10, pad: 2.5, star: 5 },
  cosy: { text: 9.5, avatar: 13, pad: 3.5, star: 6 },
  roomy: { text: 11.5, avatar: 16, pad: 4.5, star: 7.5 },
};

/** The two themes' colours. */
const THEMES: Readonly<Record<Theme, Readonly<{ ground: string; ink: string; soft: string; line: string; selected: string; bar: string }>>> = {
  light: { ground: "#fff8ec", ink: "#2a1d33", soft: "#7d6a72", line: "rgb(42 29 51 / 0.1)", selected: "#ffe1d1", bar: "#f2dcbc" },
  dark: { ground: "#231a31", ink: "#fff1dc", soft: "#b4a6c2", line: "rgb(255 241 220 / 0.12)", selected: "#3d2c4f", bar: "#4a3a60" },
};

/** The avatars' colours, by a task's place in the list of tasks. */
const AVATARS: readonly string[] = ["#ff5a1f", "#ffcc33", "#ff8db0", "#44c872", "#7e93ff", "#ffb26b"];

function Star({ size, lit }: Readonly<{ size: number; lit: boolean }>): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 10 10" width={size} height={size}>
      <path
        d="M5 .6 6.3 3.4l3 .3-2.3 2 .7 3L5 7.2 2.3 8.7l.7-3-2.3-2 3-.3z"
        fill={lit ? "#ffc426" : "currentColor"}
        opacity={lit ? 1 : 0.25}
      />
    </svg>
  );
}

function Avatar({ task, color, size }: Readonly<{ task: ScreenTask; color: string; size: number }>): ReactNode {
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-[#2a1d33] transition-[width,height] duration-300"
      style={{ width: size, height: size, background: color, fontSize: size * 0.52 }}
    >
      {task.owner.charAt(0)}
    </span>
  );
}

/** A task's row: avatar and name; the selected one also shows its stars and whether it is done. */
function TaskRow({
  task,
  color,
  density,
  selected,
  rating,
  done,
  fresh,
  freshLabel,
  theme,
}: Readonly<{
  task: ScreenTask;
  color: string;
  density: Density;
  selected: boolean;
  rating: number;
  done: boolean;
  fresh: boolean;
  freshLabel: string;
  theme: Theme;
}>): ReactNode {
  const size = SIZES[density];
  const colours = THEMES[theme];
  return (
    <li
      className={cx(
        "relative flex min-w-0 items-center gap-[5px] rounded-[4px] transition-[padding,background-color] duration-300",
        fresh && "motion-safe:animate-[screen-arrive_520ms_cubic-bezier(0.16,1,0.3,1)_both]",
      )}
      style={{ padding: `${size.pad}px ${size.pad + 1}px`, background: selected ? colours.selected : "transparent" }}
    >
      {selected ? <span aria-hidden className="absolute inset-y-[3px] left-0 w-[2px] rounded-full bg-signal" /> : null}
      <Avatar task={task} color={color} size={size.avatar} />
      <span className="flex min-w-0 flex-1 flex-col gap-[1px]">
        <span
          className={cx("truncate font-semibold leading-[1.1] tracking-[-0.01em] transition-[font-size] duration-300", done && "line-through opacity-60")}
          style={{ fontSize: size.text }}
        >
          {task.name}
        </span>
        {selected ? (
          <span className="flex gap-[1px]" style={{ color: colours.ink }}>
            {Array.from({ length: STAR_COUNT }, (_, index) => (
              <Star key={index} size={size.star} lit={index < rating} />
            ))}
          </span>
        ) : null}
      </span>
      {selected && done ? (
        <span aria-hidden className="flex size-[11px] shrink-0 items-center justify-center rounded-full bg-[#25a05c] motion-safe:animate-[screen-pop_360ms_ease-out_both]">
          <svg viewBox="0 0 10 10" className="size-[7px]">
            <path d="m2.2 5.2 1.9 1.9 3.8-4.2" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      ) : null}
      {fresh ? (
        <span className="shrink-0 rounded-full bg-signal px-[4px] py-[1px] text-[6.5px] font-bold uppercase leading-none tracking-[0.04em] text-[#2a1d33]">
          {freshLabel}
        </span>
      ) : null}
    </li>
  );
}

/** A small bar chart; the last bar is today's and grows as tasks arrive. */
function Chart({ bars, arrivals, theme }: Readonly<{ bars: readonly number[]; arrivals: number; theme: Theme }>): ReactNode {
  const today = Math.min(1, bars[bars.length - 1] + 0.14 * (arrivals % 5));
  return (
    <div aria-hidden className="flex h-full w-[30px] shrink-0 items-end gap-[2.5px] pb-[2px]">
      {bars.map((bar, index) => {
        const last = index === bars.length - 1;
        return (
          <span
            key={index}
            className="w-full rounded-t-[2px] transition-[height] duration-700 ease-out-expo"
            style={{ height: `${(last ? today : bar) * 100}%`, background: last ? "#ff5a1f" : THEMES[theme].bar }}
          />
        );
      })}
    </div>
  );
}

/**
 * The little app on the diorama's monitor, made for its real size: a header with the theme's sun or moon,
 * the selected task with its stars and tick, two tasks that keep arriving under it, a small bar chart, and
 * a toast that pops up when the orange button is pressed. The pegboard drives it through the shared state;
 * it takes no clicks of its own.
 */
export function DioramaScreen({ screen, state, width, height, onShown }: ScreenProps): ReactNode {
  const view = useSyncExternalStore(state.subscribe, state.snapshot, state.snapshot);
  useEffect(() => onShown(), [onShown]);
  const colours = THEMES[view.theme];
  const count = screen.incoming.length;
  const older = view.arrivals % count;
  const newest = (view.arrivals + 1) % count;
  const style: CSSProperties = { width, height, background: colours.ground, color: colours.ink };

  return (
    <div aria-hidden className="relative flex select-none flex-col overflow-hidden font-sans antialiased transition-colors duration-300" style={style}>
      <header className="flex h-[18px] shrink-0 items-center gap-[5px] px-[7px]" style={{ borderBottom: `1px solid ${colours.line}` }}>
        <span className="size-[7px] rounded-[2px] bg-signal" />
        <span className="text-[9px] font-semibold tracking-[-0.01em]">{screen.title}</span>
        <svg viewBox="0 0 10 10" className="ml-auto size-[9px]">
          {view.theme === "light" ? (
            <g fill="#ffb800">
              <circle cx="5" cy="5" r="2.3" />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                <rect key={angle} x="4.5" y="0.3" width="1" height="1.6" rx="0.5" transform={`rotate(${angle} 5 5)`} />
              ))}
            </g>
          ) : (
            <path d="M6.8 1.2a4 4 0 1 0 2 6.6A3.2 3.2 0 0 1 6.8 1.2z" fill="#dce5ff" />
          )}
        </svg>
      </header>
      <div className="flex min-h-0 flex-1 gap-[5px] px-[5px] pb-[4px] pt-[5px]">
        <ul className="flex min-w-0 flex-1 flex-col gap-[2px] overflow-hidden">
          <TaskRow
            task={screen.pinned}
            color={AVATARS[0]}
            density={view.density}
            selected
            rating={view.rating}
            done={view.done}
            fresh={false}
            freshLabel={screen.fresh}
            theme={view.theme}
          />
          {[older, newest].map((index, place) => (
            <TaskRow
              key={`${index}-${place === 1 ? view.arrivals : "kept"}`}
              task={screen.incoming[index]}
              color={AVATARS[(index + 1) % AVATARS.length]}
              density={view.density}
              selected={false}
              rating={0}
              done={false}
              fresh={place === 1 && view.arrivals > 0}
              freshLabel={screen.fresh}
              theme={view.theme}
            />
          ))}
        </ul>
        <Chart bars={screen.chart} arrivals={view.arrivals} theme={view.theme} />
      </div>
      {view.toasts > 0 ? (
        <span key={view.toasts} className="pointer-events-none absolute inset-x-0 bottom-[7px] flex justify-center">
          <span className="flex items-center gap-[3px] whitespace-nowrap rounded-full bg-signal px-[7px] py-[3px] text-[8.5px] font-bold leading-none text-[#2a1d33] shadow-[0_3px_8px_-3px_rgb(42_29_51/0.6)] animate-[screen-toast_1.9s_cubic-bezier(0.16,1,0.3,1)_both] motion-reduce:animate-[screen-toast-still_1.9s_linear_both]">
            <svg aria-hidden viewBox="0 0 10 10" className="size-[7px]">
              <path d="m2 5.3 2 2 4-4.6" fill="none" stroke="#2a1d33" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {screen.toast}
          </span>
        </span>
      ) : null}
    </div>
  );
}
