import type { ReactNode } from "react";
import type { Craft, RepoLabels } from "@/content";
import { Chapter } from "@/story";
import { Container, ExhibitHeader, RepoCards, SectionHeader, SkillTable } from "@/ui";
import { SpecWorkbench } from "./SpecWorkbench";

type CraftChapterProps = Readonly<{ craft: Craft; repoLabels: RepoLabels }>;

/** Chapter 03: the front end as a skill table and repositories, then a specimen whose spec the visitor can switch on. */
export function CraftChapter({ craft, repoLabels }: CraftChapterProps): ReactNode {
  return (
    <Chapter id="craft" className="bg-paper-raised py-32 lg:py-48">
      <Container>
        <div className="flex flex-col gap-14">
          <SectionHeader index="03" label={craft.label} heading={craft.heading} intro={craft.intro} />
          <SkillTable areas={craft.areas} caption={`${craft.heading} skills`} />
          <RepoCards repos={craft.repos} labels={repoLabels} surface="paper" />
        </div>
        <div className="mt-24 lg:mt-32">
          <SpecWorkbench craft={craft} header={<ExhibitHeader exhibit={craft.exhibit} />} />
        </div>
      </Container>
    </Chapter>
  );
}
