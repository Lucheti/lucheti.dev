import type { ReactNode } from "react";
import type { CaseSection, Department, OrchestraPage } from "@/content";
import { Container, SubsectionHeader, ToolPills } from "@/ui";
import { DepartmentGrid } from "./DepartmentGrid";
import { PointList } from "./PointList";

type CaseSectionsProps = Readonly<{
  sections: readonly CaseSection[];
  departments: readonly Department[];
  builtWith: OrchestraPage["builtWith"];
}>;

function assertNever(value: never): never {
  throw new Error(`Unhandled case-study section: ${String(value)}`);
}

function bodyOf(section: CaseSection, departments: readonly Department[]): ReactNode {
  switch (section.kind) {
    case "points":
      return <PointList points={section.points} />;
    case "departments":
      return <DepartmentGrid departments={departments} duties={section.duties} />;
    default:
      return assertNever(section);
  }
}

/** The parts after the live demo, on paper, then the tools Orchestra is built with. */
export function CaseSections({ sections, departments, builtWith }: CaseSectionsProps): ReactNode {
  return (
    <div className="bg-paper py-32 lg:py-48">
      <Container className="flex flex-col gap-24 lg:gap-36">
        {sections.map((section, position) => {
          const id = `case-section-${position}`;
          return (
            <section key={section.title} aria-labelledby={id}>
              <SubsectionHeader id={id} title={section.title} caption={section.intro} />
              {bodyOf(section, departments)}
            </section>
          );
        })}
        <section aria-labelledby="case-built-with" className="border-t border-ink pt-6">
          <h3 id="case-built-with" className="font-label text-[11px] font-medium uppercase tracking-[0.14em] text-mute">
            {builtWith.title}
          </h3>
          <ToolPills tools={builtWith.tools} className="mt-5 max-w-[60rem]" />
        </section>
      </Container>
    </div>
  );
}
