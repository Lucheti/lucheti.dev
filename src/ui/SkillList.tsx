import type { ReactNode } from "react";
import type { SkillArea } from "@/content";
import { ToolPills } from "./ToolPill";

type SkillListProps = Readonly<{
  areas: readonly SkillArea[];
  /** Visually hidden name of the list, e.g. "Front end skills". */
  label: string;
}>;

/**
 * A compact skill list that fits under a chapter heading: each area's short name on the left, its
 * libraries as small pills on the right, one hairline between rows. On narrow screens the name sits
 * above its pills.
 */
export function SkillList({ areas, label }: SkillListProps): ReactNode {
  return (
    <dl aria-label={label} className="flex flex-col border-t border-line">
      {areas.map((area) => (
        <div key={area.name} className="flex flex-col gap-2 border-b border-line py-3 sm:flex-row sm:items-baseline sm:gap-4">
          <dt className="shrink-0 text-sm font-semibold tracking-[-0.01em] text-ink sm:w-[7.5rem]">{area.name}</dt>
          <dd className="min-w-0 flex-1">
            <ToolPills tools={area.tools} size="sm" />
          </dd>
        </div>
      ))}
    </dl>
  );
}
