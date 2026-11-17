import type { ReactNode } from "react";
import { cx } from "./cx";
import type { Tone } from "./Tone";

/** Small hairline tag for stacks and sources. */
export function Chip({ children, tone = "light" }: { readonly children: ReactNode; readonly tone?: Tone }): ReactNode {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-[3px] border px-2.5 py-1 font-label font-medium text-[11px] uppercase tracking-[0.12em]",
        tone === "light" ? "border-line-strong text-ink-soft" : "border-line-dark-strong text-fog-dim",
      )}
    >
      {children}
    </span>
  );
}
