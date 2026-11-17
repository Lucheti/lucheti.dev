import type { ReactNode } from "react";
import type { Ai, Capabilities } from "@/content";
import { Chapter } from "@/story";
import { Container, RepoCards, SectionHeader, SkillTable, SubsectionHeader, twoDigits } from "@/ui";

type AiChapterProps = Readonly<{ ai: Ai; capabilities: Capabilities }>;

/** Chapter 05: AI as two numbered parts. The pinned Orchestra chapter that follows is its third, the live demo. */
export function AiChapter({ ai, capabilities }: AiChapterProps): ReactNode {
  const { subsections, countUnits } = capabilities;
  return (
    <Chapter id="ai" className="bg-paper pb-24 pt-32 lg:pb-32 lg:pt-48">
      <Container className="flex flex-col gap-24 lg:gap-36">
        <SectionHeader index="05" label={ai.label} heading={ai.heading} intro={ai.intro} />
        <section aria-labelledby="ai-skills">
          <SubsectionHeader
            id="ai-skills"
            number="05.1"
            title={subsections.skills.title}
            caption={subsections.skills.caption}
            count={`${twoDigits(ai.areas.length)} ${countUnits.areas}`}
          />
          <SkillTable areas={ai.areas} caption={`${ai.heading} skills`} />
        </section>
        <section aria-labelledby="ai-repos">
          <SubsectionHeader
            id="ai-repos"
            number="05.2"
            title={subsections.repos.title}
            caption={subsections.repos.caption}
            count={`${twoDigits(ai.repos.length)} ${countUnits.repos}`}
          />
          <RepoCards repos={ai.repos} labels={capabilities.repoLabels} surface="raised" />
        </section>
      </Container>
    </Chapter>
  );
}
