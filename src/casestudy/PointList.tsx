import type { ReactNode } from "react";
import type { CasePoint } from "@/content";

/** Points as a two-column list: a bold lead phrase, then one sentence. */
export function PointList({ points }: Readonly<{ points: readonly CasePoint[] }>): ReactNode {
  return (
    <ul className="grid gap-x-12 gap-y-8 md:grid-cols-2">
      {points.map((point) => (
        <li key={point.lead} className="min-w-0 border-t border-line pt-5">
          <p className="text-base leading-[1.55] text-ink-soft md:text-[17px]">
            <strong className="font-semibold text-ink">{point.lead}</strong> {point.text}
          </p>
        </li>
      ))}
    </ul>
  );
}
