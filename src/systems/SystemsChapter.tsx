import type { ReactNode } from "react";
import type { Systems } from "@/content";
import { Chapter } from "@/story";
import { BulletList, Container, ExhibitHeader, SectionHeader, SkillTable } from "@/ui";
import { SagaDiagram } from "./SagaDiagram";

/** Chapter 04: the back end as a skill table, then a saga the visitor can break. */
export function SystemsChapter({ systems }: { readonly systems: Systems }): ReactNode {
  return (
    <Chapter id="systems" className="bg-paper-sunk py-32 lg:py-48">
      <Container className="flex flex-col gap-16 lg:gap-20">
        <div className="flex flex-col gap-14">
          <SectionHeader index="04" label={systems.label} heading={systems.heading} intro={systems.intro} />
          <SkillTable areas={systems.areas} caption={`${systems.heading} skills`} />
        </div>

        <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <ExhibitHeader exhibit={systems.exhibit} />
          </div>
          <div className="lg:col-span-5">
            <BulletList items={systems.principles} />
          </div>
        </div>

        <SagaDiagram systems={systems} />
      </Container>
    </Chapter>
  );
}
