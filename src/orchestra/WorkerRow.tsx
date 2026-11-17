import type { ReactNode } from "react";
import { cx } from "@/ui";
import { ACTIVITY } from "./ActivityClasses";
import { ActivityBar, rhythmVars } from "./ActivityBar";
import type { Rhythm } from "./ActivityRhythm";
import type { RosterRow } from "./Roster";

type WorkerRowProps = Readonly<{
  row: RosterRow;
  busy: boolean;
  rhythm: Rhythm;
}>;

const SPINNER_FRAMES = ["|", "/", "-", "\\"] as const;
const BUSY_WORD = "busy";

/** One agent on a department card: dim and still when idle, ticking when busy. */
export function WorkerRow({ row, busy, rhythm }: WorkerRowProps): ReactNode {
  return (
    <li className="relative flex h-[var(--row)] items-center gap-2" style={busy ? rhythmVars(rhythm) : undefined}>
      <span
        aria-hidden
        className={cx(
          "size-1.5 shrink-0 transition-colors duration-300",
          busy ? cx("bg-fog", ACTIVITY.pulse) : "border border-fog-dim/40",
        )}
      />
      <span
        className={cx(
          "min-w-0 flex-1 truncate font-label text-[10px] leading-none transition-colors duration-300 xl:text-[11px]",
          busy ? "text-fog" : "text-fog-dim/55",
        )}
      >
        {row.agent}
        {row.instances > 1 && <span className="text-fog-dim/70"> ·{row.instance}</span>}
        {busy && <span className="sr-only"> {BUSY_WORD}</span>}
      </span>
      <span aria-hidden className="h-3 w-2 shrink-0 overflow-hidden font-label text-[10px] leading-3 text-fog-dim">
        {busy && (
          <span className={cx("flex flex-col", ACTIVITY.spin)}>
            {SPINNER_FRAMES.map((frame) => (
              <span key={frame} className="h-3 text-center">
                {frame}
              </span>
            ))}
          </span>
        )}
      </span>
      <ActivityBar busy={busy} className="absolute inset-x-0 bottom-0 h-px" />
    </li>
  );
}

type CodeRowProps = Readonly<{
  label: string;
  running: boolean;
  rhythm: Rhythm;
}>;

/** The line on a card for work done by code, not by an agent. */
export function CodeRow({ label, running, rhythm }: CodeRowProps): ReactNode {
  return (
    <li className="relative flex h-[var(--row)] items-center gap-2" style={running ? rhythmVars(rhythm) : undefined}>
      <span
        aria-hidden
        className={cx("size-1.5 shrink-0 border transition-colors duration-300", running ? "border-signal bg-signal" : "border-fog-dim/40")}
      />
      <span
        className={cx(
          "min-w-0 flex-1 truncate font-label font-medium text-[10px] uppercase leading-none tracking-[0.14em] transition-colors duration-300",
          running ? "text-signal" : "text-fog-dim/55",
        )}
      >
        {label}
      </span>
      <ActivityBar busy={running} className="absolute inset-x-0 bottom-0 h-px" />
    </li>
  );
}
