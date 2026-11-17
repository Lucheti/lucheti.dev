import type { ReactNode } from "react";
import { cx } from "./cx";
import { Reveal } from "./Reveal";
import type { Tone } from "./Tone";

type SubsectionHeaderProps = Readonly<{
  /** The title's id, so the surrounding section can name itself with aria-labelledby. */
  id?: string;
  title: string;
  caption?: string;
  tone?: Tone;
}>;

/** Opens a part of a chapter: a rule, a display title led by a signal square, and a caption. */
export function SubsectionHeader({ id, title, caption, tone = "light" }: SubsectionHeaderProps): ReactNode {
  const light = tone === "light";
  return (
    <Reveal className="mb-10 lg:mb-14">
      <div className={cx("flex min-w-0 flex-col gap-3 border-t pt-6", light ? "border-ink" : "border-fog")}>
        <h3
          id={id}
          className={cx(
            "font-display text-3xl font-semibold leading-[1.02] tracking-[-0.035em] md:text-[2.75rem]",
            light ? "text-ink" : "text-fog",
          )}
        >
          <span aria-hidden className="mr-[0.32em] inline-block size-[0.5em] bg-signal align-[0.1em]" />
          {title}
        </h3>
        {caption ? (
          <p className={cx("max-w-[44ch] text-base leading-[1.55] md:text-lg", light ? "text-ink-soft" : "text-fog-dim")}>
            {caption}
          </p>
        ) : null}
      </div>
    </Reveal>
  );
}
