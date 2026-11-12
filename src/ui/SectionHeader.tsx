import type { ReactNode } from "react";
import { cx } from "./cx";
import { Label } from "./Label";
import { Reveal } from "./Reveal";
import type { Tone } from "./Tone";

type SectionHeaderProps = Readonly<{
  label: string;
  heading: string;
  intro: string;
  /** Chapter number shown before the label, e.g. "02". */
  index?: string;
  tone?: Tone;
}>;

/** Numbered label, h2 and one-line intro, shared by every chapter after the hero. */
export function SectionHeader({ label, heading, intro, index, tone = "light" }: SectionHeaderProps): ReactNode {
  return (
    <header className="flex flex-col gap-5">
      <Reveal>
        <Label marked tone={tone}>
          {index ? `${index} — ${label}` : label}
        </Label>
      </Reveal>
      <Reveal delay={0.08}>
        <h2
          className={cx(
            "max-w-[16ch] text-balance font-display text-[clamp(2.25rem,5vw,4.5rem)] font-semibold leading-[0.95] tracking-[-0.045em]",
            tone === "light" ? "text-ink" : "text-fog",
          )}
        >
          {heading}
        </h2>
      </Reveal>
      <Reveal delay={0.16}>
        <p className={cx("max-w-[30rem] text-base leading-[1.6] md:text-lg", tone === "light" ? "text-ink-soft" : "text-fog-dim")}>
          {intro}
        </p>
      </Reveal>
    </header>
  );
}
