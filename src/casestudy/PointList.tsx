import type { ReactNode } from "react";
import type { CasePoint } from "@/content";
import { twoDigits } from "@/ui";

/** Points as a two-column list: a dot-matrix index, a bold lead phrase, then one sentence. */
export function PointList({ points }: Readonly<{ points: readonly CasePoint[] }>): ReactNode {
  return (
    <ol className="grid gap-x-12 gap-y-8 md:grid-cols-2">
      {points.map((point, index) => (
        <li key={point.lead} className="flex min-w-0 flex-col gap-3 border-t border-line pt-5">
          <span aria-hidden className="font-dot text-xl text-signal-ink">
            {twoDigits(index + 1)}
          </span>
          <p className="text-base leading-[1.55] text-ink-soft md:text-[17px]">
            <strong className="font-semibold text-ink">{point.lead}</strong> {point.text}
          </p>
        </li>
      ))}
    </ol>
  );
}
