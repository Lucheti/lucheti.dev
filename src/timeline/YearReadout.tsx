import { motion, type MotionValue } from "motion/react";
import type { ReactNode } from "react";

type YearReadoutProps = Readonly<{
  year: string;
  period: string;
  /** Where along the bar (0..1) the era turns, so the colour can change there. */
  eraFraction: number;
  inkScale: MotionValue<number>;
  orangeScale: MotionValue<number>;
}>;

/** Top-right dot-matrix year of the stop at the reading line, with a progress bar. */
export function YearReadout({ year, period, eraFraction, inkScale, orangeScale }: YearReadoutProps): ReactNode {
  const split = `${eraFraction * 100}%`;
  return (
    <div className="pointer-events-none absolute right-6 top-[88px] z-10 flex flex-col items-end bg-paper pl-4 md:right-10 lg:right-16">
      <p
        aria-live="polite"
        className="font-dot text-[clamp(4rem,9vw,8rem)] font-black leading-[0.9] tracking-[-0.02em] text-ink"
      >
        {year}
      </p>
      <p className="mt-2 font-label font-medium text-[11px] uppercase tracking-[0.16em] text-mute">{period}</p>
      <div aria-hidden className="relative mt-3 h-0.5 w-48 bg-line md:w-64">
        <motion.span
          className="absolute inset-y-0 left-0 origin-left bg-ink"
          style={{ width: split, scaleX: inkScale }}
        />
        <motion.span
          className="absolute inset-y-0 right-0 origin-left bg-signal"
          style={{ left: split, scaleX: orangeScale }}
        />
      </div>
    </div>
  );
}
