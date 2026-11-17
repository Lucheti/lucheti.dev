import type { ReactNode } from "react";
import type { Exhibit } from "@/content";
import { cx } from "./cx";
import { Reveal } from "./Reveal";
import type { Tone } from "./Tone";

type ExhibitHeaderProps = Readonly<{
  exhibit: Exhibit;
  tone?: Tone;
  className?: string;
}>;

/** The small header that introduces a chapter's demo: mono label, title and a one-line caption. */
export function ExhibitHeader({ exhibit, tone = "light", className }: ExhibitHeaderProps): ReactNode {
  const light = tone === "light";
  return (
    <Reveal className={cx("flex flex-col gap-3", className)}>
      <p className={cx("font-mono text-[11px] uppercase tracking-[0.16em]", light ? "text-signal-ink" : "text-signal")}>
        {exhibit.label}
      </p>
      <h3
        className={cx(
          "font-display text-2xl font-semibold leading-[1.05] tracking-[-0.03em]",
          light ? "text-ink" : "text-fog",
        )}
      >
        {exhibit.title}
      </h3>
      <p className={cx("max-w-[34rem] text-base leading-[1.55]", light ? "text-ink-soft" : "text-fog-dim")}>
        {exhibit.caption}
      </p>
    </Reveal>
  );
}
