import type { ReactNode } from "react";
import type { Department, DepartmentsSection } from "@/content";
import { ToolPills } from "@/ui";

type DepartmentGridProps = Readonly<{
  departments: readonly Department[];
  duties: DepartmentsSection["duties"];
}>;

/** One card per department: name, what it does, and its agents with the head first. */
export function DepartmentGrid({ departments, duties }: DepartmentGridProps): ReactNode {
  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {departments.map((department) => (
        <li key={department.id} className="min-w-0">
          <article className="flex h-full flex-col rounded-lg border border-line bg-paper-raised p-6">
            <h4 className="font-display text-xl font-semibold tracking-[-0.02em] text-ink md:text-2xl">{department.name}</h4>
            <p className="mt-3 text-[15px] leading-[1.55] text-ink-soft">{duties[department.id]}</p>
            <div className="mt-auto pt-6">
              <div className="border-t border-line pt-4">
                <p className="mb-3 font-label text-[11px] font-medium uppercase tracking-[0.14em] text-mute">
                  {department.agents.length === 1 ? "Agent" : "Agents"}
                </p>
                <ToolPills tools={department.agents} />
              </div>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
