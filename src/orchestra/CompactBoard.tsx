import type { ReactNode } from "react";
import { cx } from "@/ui";
import { ActivityBar, rhythmVars } from "./ActivityBar";
import { rhythmFor } from "./ActivityRhythm";
import { BY_CODE, DoneMark, isActive } from "./DepartmentCard";
import type { BoardState } from "./LifecycleScript";
import { Roster } from "./Roster";
import { StatusPill } from "./StatusPill";

type CompactBoardProps = Readonly<{
  roster: Roster;
  state: BoardState;
  className?: string;
}>;

const BOARD_LABEL = "Department board";

/** Below lg: one line per department with its status and a bar per busy worker. */
export function CompactBoard({ roster, state, className }: CompactBoardProps): ReactNode {
  return (
    <ul aria-label={BOARD_LABEL} className={cx("divide-y divide-line-dark border-y border-line-dark", className)}>
      {roster.departmentIds().map((id) => {
        const department = state.departments.get(id);
        if (department === undefined) {
          return null;
        }
        const { status } = department;
        const busy = status.kind === "working" ? status.rows : [];
        const active = isActive(status);
        return (
          <li key={id} className="flex h-[clamp(1.5rem,3.6dvh,2rem)] items-center gap-3">
            <span
              aria-hidden
              className={cx("h-3 w-0.5 shrink-0 transition-colors duration-300", active ? "bg-signal" : "bg-transparent")}
            />
            <span
              className={cx(
                "flex min-w-0 flex-1 items-center gap-1.5 font-label font-medium text-[11px] uppercase tracking-[0.14em] transition-colors duration-300",
                active ? "text-fog" : "text-fog-dim",
              )}
            >
              <span className="truncate">{roster.nameOf(id)}</span>
              {department.done && <DoneMark />}
            </span>
            <StatusPill status={status} />
            <span className="flex w-[5.5rem] shrink-0 items-center justify-end gap-1">
              {busy.map((row) => (
                <span key={row} style={rhythmVars(rhythmFor(roster.boardIndexOf(id, row)))}>
                  <ActivityBar busy className="h-0.5 w-3.5" />
                </span>
              ))}
              {status.kind === "automated" && (
                <span className="font-label font-medium text-[10px] uppercase tracking-[0.14em] text-signal">{BY_CODE}</span>
              )}
              <span className="w-4 text-right font-label text-[11px] text-fog">{busy.length > 0 ? busy.length : ""}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
