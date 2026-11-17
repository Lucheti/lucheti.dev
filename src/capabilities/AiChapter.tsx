import type { ReactNode } from "react";
import type { Ai, Capabilities, Stat } from "@/content";
import { Chapter } from "@/story";
import { Container, DomainBackdrop, RepoCards, SectionHeader, SkillTable, SubsectionHeader, twoDigits } from "@/ui";
import { CaseStudyCard } from "./CaseStudyCard";

type AiChapterProps = Readonly<{
  ai: Ai;
  capabilities: Capabilities;
  /** The figures shown on the case-study card. */
  stats: readonly Stat[];
}>;

/** Chapter 05: AI as three numbered parts: skills, repositories and Orchestra, the featured project with its own page. */
export function AiChapter({ ai, capabilities, stats }: AiChapterProps): ReactNode {
  const { subsections, countUnits } = capabilities;
  return (
    <Chapter id="ai" className="relative bg-paper py-32 lg:py-48">
      <DomainBackdrop kind="ai" />
      <Container className="relative flex flex-col gap-24 lg:gap-36">
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
        <section aria-labelledby="ai-case-study">
          <SubsectionHeader
            id="ai-case-study"
            number="05.3"
            title={ai.caseStudy.title}
            caption={ai.caseStudy.caption}
          />
          <CaseStudyCard study={ai.caseStudy} stats={stats} />
        </section>
      </Container>
    </Chapter>
  );
}
