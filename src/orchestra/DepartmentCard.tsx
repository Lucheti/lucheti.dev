import type { ReactNode, Ref } from "react";
import type { DepartmentId } from "@/content";
import { cx } from "@/ui";
import { rhythmFor } from "./ActivityRhythm";
import type { DepartmentState, DepartmentStatus } from "./LifecycleScript";
import { Roster } from "./Roster";
import { StatusPill } from "./StatusPill";
import { CodeRow, WorkerRow } from "./WorkerRow";

type DepartmentCardProps = Readonly<{
  id: DepartmentId;
  roster: Roster;
  state: DepartmentState;
  /** Grid placement classes. */
  className: string;
  cardRef: Ref<HTMLDivElement>;
}>;

/** Said under the cards of departments whose step runs without an agent. */
export const BY_CODE = "by code";
const DONE_WORD = "done";

function busyRowsOf(status: DepartmentStatus): readonly string[] {
  return status.kind === "working" ? status.rows : [];
}

/** Holding the ticket, so the card takes the accent. */
export function isActive(status: DepartmentStatus): boolean {
  return status.kind === "working" || status.kind === "automated";
}

/** A done tick drawn in two strokes; decorative, the word is for screen readers. */
export function DoneMark(): ReactNode {
  return (
    <>
      <svg aria-hidden viewBox="0 0 10 10" className="size-2.5 shrink-0 text-fog-dim">
        <path d="M1.5 5.5 L4 8 L8.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
      <span className="sr-only">{DONE_WORD}</span>
    </>
  );
}

/** One department on the board: its name, its status and every agent on its roster. */
export function DepartmentCard({ id, roster, state, className, cardRef }: DepartmentCardProps): ReactNode {
  const busy = busyRowsOf(state.status);
  const active = isActive(state.status);
  const rows = roster.rowsOf(id);

  return (
    <div
      ref={cardRef}
      role="listitem"
      className={cx(
        "relative flex min-w-0 flex-col rounded-md border bg-graphite-raised/85 px-3 pb-2.5 pt-3 transition-colors duration-300",
        active ? "border-signal" : "border-line-dark",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-1.5">
        <p
          className={cx(
            "flex min-w-0 items-center gap-1.5 font-label font-medium text-[11px] uppercase leading-4 tracking-[0.12em] transition-colors duration-300",
            active ? "text-fog" : "text-fog-dim",
          )}
        >
          <span className="truncate">{roster.nameOf(id)}</span>
          {state.done && <DoneMark />}
        </p>
        <StatusPill status={state.status} />
      </div>
      <ul className="mt-2.5 flex flex-col gap-1">
        {rows.map((row) => (
          <WorkerRow
            key={row.id}
            row={row}
            busy={busy.includes(row.id)}
            rhythm={rhythmFor(roster.boardIndexOf(id, row.id))}
          />
        ))}
        {roster.hasAutomatedStep(id) && (
          <CodeRow
            label={BY_CODE}
            running={state.status.kind === "automated"}
            rhythm={rhythmFor(roster.boardIndexOf(id, Roster.CODE_ROW))}
          />
        )}
      </ul>
    </div>
  );
}
