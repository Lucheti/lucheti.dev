import type { ReactNode } from "react";
import { cx } from "./cx";
import { Reveal } from "./Reveal";
import type { Tone } from "./Tone";

type SubsectionHeaderProps = Readonly<{
  /** The title's id, so the surrounding section can name itself with aria-labelledby. */
  id?: string;
  /** Chapter and part, e.g. "03.1". */
  number: string;
  title: string;
  caption?: string;
  /** A small figure on the right from md up, e.g. "05 areas". */
  count?: string;
  tone?: Tone;
}>;

/** Opens a numbered part of a domain chapter: a rule, the number in dot-matrix, a display title and a caption. */
export function SubsectionHeader({ id, number, title, caption, count, tone = "light" }: SubsectionHeaderProps): ReactNode {
  const light = tone === "light";
  return (
    <Reveal className="mb-10 lg:mb-14">
      <div className={cx("flex items-start justify-between gap-8 border-t pt-6", light ? "border-ink" : "border-fog")}>
        <div className="flex min-w-0 flex-col gap-3">
          <span className={cx("font-dot text-2xl md:text-3xl", light ? "text-signal-ink" : "text-signal")}>{number}</span>
          <h3
            id={id}
            className={cx(
              "font-display text-3xl font-semibold leading-[1.02] tracking-[-0.035em] md:text-[2.75rem]",
              light ? "text-ink" : "text-fog",
            )}
          >
            {title}
          </h3>
          {caption ? (
            <p className={cx("max-w-[44ch] text-base leading-[1.55] md:text-lg", light ? "text-ink-soft" : "text-fog-dim")}>
              {caption}
            </p>
          ) : null}
        </div>
        {count ? (
          <span
            className={cx(
              "hidden shrink-0 pt-2 font-label font-medium text-[11px] uppercase tracking-[0.14em] md:block",
              light ? "text-mute" : "text-fog-dim",
            )}
          >
            {count}
          </span>
        ) : null}
      </div>
    </Reveal>
  );
}
