import type { ReactNode } from "react";
import type { Ai, RepoLabels } from "@/content";
import { Chapter } from "@/story";
import { Container, RepoCards, SectionHeader, SkillTable } from "@/ui";

type AiChapterProps = Readonly<{ ai: Ai; repoLabels: RepoLabels }>;

/** Chapter 05: AI as a skill table and repositories. The pinned Orchestra chapter that follows is its exhibit. */
export function AiChapter({ ai, repoLabels }: AiChapterProps): ReactNode {
  return (
    <Chapter id="ai" className="bg-paper pb-24 pt-32 lg:pb-32 lg:pt-48">
      <Container className="flex flex-col gap-14 lg:gap-20">
        <SectionHeader index="05" label={ai.label} heading={ai.heading} intro={ai.intro} />
        <SkillTable areas={ai.areas} caption={`${ai.heading} skills`} />
        <RepoCards repos={ai.repos} labels={repoLabels} surface="raised" />
      </Container>
    </Chapter>
  );
}
