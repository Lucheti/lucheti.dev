import type { ReactNode } from "react";
import { cx } from "@/ui";
import { ACTIVITY } from "./ActivityClasses";
import type { LifecycleScript } from "./LifecycleScript";
import type { Roster } from "./Roster";

type DispatchLogProps = Readonly<{
  script: LifecycleScript;
  roster: Roster;
  /** How many steps have been dispatched; each is one line. */
  dispatched: number;
}>;

/** Must match the `h-[calc(6*1.25rem+1.5rem)]` class below; Tailwind needs the literal. */
const VISIBLE_ROWS = 6;
const LOG_LABEL = "Dispatch log";

function Cursor(): ReactNode {
  return <span aria-hidden className={cx("ml-1 inline-block h-3 w-1.5 translate-y-0.5 bg-fog", ACTIVITY.blink)} />;
}

/** A small terminal of every handoff so far, newest at the bottom. */
export function DispatchLog({ script, roster, dispatched }: DispatchLogProps): ReactNode {
  const from = Math.max(0, dispatched - VISIBLE_ROWS);
  const indices = Array.from({ length: dispatched - from }, (_, offset) => from + offset);

  return (
    <div
      role="log"
      aria-label={LOG_LABEL}
      className="h-[calc(6*1.25rem+1.5rem)] overflow-hidden rounded-md border border-line-dark bg-graphite-raised/90 px-3 py-3 font-label text-xs leading-5"
    >
      {indices.map((index) => {
        const step = script.step(index);
        return (
          <p key={index} className="truncate text-fog">
            <span className="text-fog-dim">{String(index + 1).padStart(2, "0")}</span>{" "}
            <span className="text-signal">{step.ticket}</span> {roster.nameOf(step.department)} · {step.message}
            {index === dispatched - 1 && <Cursor />}
          </p>
        );
      })}
      {dispatched === 0 && (
        <p>
          <Cursor />
        </p>
      )}
    </div>
  );
}
