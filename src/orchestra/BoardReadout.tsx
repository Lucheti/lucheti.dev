import type { ReactNode } from "react";
import { cx } from "@/ui";
import type { Phase } from "./LifecycleScript";

type BoardReadoutProps = Readonly<{
  phase: Phase;
  ticket: string;
  stepCount: number;
  className?: string;
}>;

const STEP_LABEL = "Step";
const PHASE_WORDS: Readonly<Record<Phase["kind"], string>> = {
  waiting: "standby",
  transit: "in flight",
  holding: "in progress",
};

function reachedOf(phase: Phase): number {
  return phase.kind === "waiting" ? 0 : phase.step + 1;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** The board's quiet corner: which step of the lifecycle is playing and where the ticket is. */
export function BoardReadout({ phase, ticket, stepCount, className }: BoardReadoutProps): ReactNode {
  return (
    <div
      aria-hidden
      className={cx(
        "flex min-w-0 flex-col justify-center gap-2 rounded-md border border-dashed border-line-dark px-3 py-3",
        className,
      )}
    >
      <p className="font-label font-medium text-[10px] uppercase leading-none tracking-[0.16em] text-fog-dim">{STEP_LABEL}</p>
      <p className="font-dot font-black leading-none text-fog">
        <span className="text-[clamp(1.75rem,3.6dvh,2.5rem)]">{pad(reachedOf(phase))}</span>
        <span className="text-[clamp(1rem,2dvh,1.375rem)] text-fog-dim">/{pad(stepCount)}</span>
      </p>
      <p className="truncate font-label font-medium text-[10px] uppercase leading-none tracking-[0.14em] text-fog-dim">
        <span className={phase.kind === "waiting" ? undefined : "text-signal"}>{ticket}</span> · {PHASE_WORDS[phase.kind]}
      </p>
    </div>
  );
}
