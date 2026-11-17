import type { ReactNode } from "react";
import { cx } from "./cx";
import type { Tone } from "./Tone";

type LabelProps = Readonly<{
  children: ReactNode;
  /** Prefixes the label with a small signal-orange square. */
  marked?: boolean;
  tone?: Tone;
  className?: string;
}>;

const TONE_CLASSES: Readonly<Record<Tone, string>> = {
  light: "text-ink-soft",
  dark: "text-fog-dim",
};

/** Small uppercase mono caption used for eyebrows, section labels and annotations. */
export function Label({ children, marked = false, tone = "light", className }: LabelProps): ReactNode {
  return (
    <p
      className={cx(
        "flex items-center gap-3 font-label font-medium text-[11px] uppercase tracking-[0.16em]",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {marked && <span aria-hidden className="size-1.5 bg-signal" />}
      {children}
    </p>
  );
}
