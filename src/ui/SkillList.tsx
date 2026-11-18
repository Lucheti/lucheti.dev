import type { ReactNode } from "react";
import type { SkillArea } from "@/content";
import { ToolPills } from "./ToolPill";

type SkillListProps = Readonly<{
  areas: readonly SkillArea[];
  /** The card's small title, e.g. "Skills". */
  title: string;
  /** Name of the list for assistive technology, e.g. "Front end skills". */
  label: string;
}>;

/**
 * A compact skill card that fits under a chapter heading: a small title, then each area's short name on
 * the left and its libraries as small pills on the right, one hairline between rows. The white card is the
 * one the feature panels use. On narrow screens the name sits above its pills.
 */
export function SkillList({ areas, title, label }: SkillListProps): ReactNode {
  return (
    <section
      aria-label={label}
      className="rounded-2xl bg-white px-5 pb-2 pt-5 text-ink shadow-[0_30px_70px_-40px_rgb(14_14_14/0.35)] ring-1 ring-inset ring-line sm:px-6 sm:pt-6"
    >
      <p className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em]">
        <span aria-hidden className="size-2 rounded-[2px] bg-signal" />
        {title}
      </p>
      <dl className="mt-3 flex flex-col divide-y divide-line">
        {areas.map((area) => (
          <div key={area.name} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-baseline sm:gap-4">
            <dt className="shrink-0 text-sm font-medium tracking-[-0.01em] text-ink-soft sm:w-[7rem]">{area.name}</dt>
            <dd className="min-w-0 flex-1">
              <ToolPills tools={area.tools} size="sm" />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
