import type { ReactNode } from "react";
import { cx } from "./cx";
import { Label } from "./Label";
import { Reveal } from "./Reveal";
import type { Tone } from "./Tone";

type SectionHeaderProps = Readonly<{
  /** A plain word above the heading, e.g. "Build log"; left out where the heading says it all. */
  label?: string;
  heading: string;
  intro: string;
  tone?: Tone;
}>;

/** Optional label, h2 and one-line intro, shared by every chapter after the hero. */
export function SectionHeader({ label, heading, intro, tone = "light" }: SectionHeaderProps): ReactNode {
  return (
    <header className="flex flex-col gap-5">
      {label ? (
        <Reveal>
          <Label marked tone={tone}>
            {label}
          </Label>
        </Reveal>
      ) : null}
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
