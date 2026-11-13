import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/ui";
import { ACTIVITY } from "./ActivityClasses";
import type { Rhythm } from "./ActivityRhythm";

type RhythmVars = CSSProperties & {
  "--fill": number;
  "--delay": number;
  "--pulse": number;
  "--spin": number;
  "--still": number;
};

/** The custom properties the activity keyframes read. */
export function rhythmVars(rhythm: Rhythm): RhythmVars {
  return {
    "--fill": rhythm.fill,
    "--delay": rhythm.delay,
    "--pulse": rhythm.pulse,
    "--spin": rhythm.spin,
    "--still": rhythm.still,
  };
}

type ActivityBarProps = Readonly<{
  busy: boolean;
  className?: string;
}>;

/** A hairline track; while busy, an orange fill runs along it and starts over. */
export function ActivityBar({ busy, className }: ActivityBarProps): ReactNode {
  return (
    <span aria-hidden className={cx("relative block overflow-hidden bg-line-dark", className)}>
      {busy && <span className={cx("absolute inset-0 bg-signal", ACTIVITY.fill)} />}
    </span>
  );
}
