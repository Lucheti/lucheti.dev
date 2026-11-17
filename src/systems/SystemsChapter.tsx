import type { ReactNode } from "react";
import type { RepoLabels, Systems } from "@/content";
import { Chapter } from "@/story";
import { Container, RepoCards, SectionHeader, SkillTable } from "@/ui";

type SystemsChapterProps = Readonly<{ systems: Systems; repoLabels: RepoLabels }>;

/** Chapter 04: the back end as a skill table and the repositories behind it. */
export function SystemsChapter({ systems, repoLabels }: SystemsChapterProps): ReactNode {
  return (
    <Chapter id="systems" className="bg-paper-sunk py-32 lg:py-48">
      <Container className="flex flex-col gap-14 lg:gap-20">
        <SectionHeader index="04" label={systems.label} heading={systems.heading} intro={systems.intro} />
        <SkillTable areas={systems.areas} caption={`${systems.heading} skills`} />
        <RepoCards repos={systems.repos} labels={repoLabels} surface="raised" />
      </Container>
    </Chapter>
  );
}
