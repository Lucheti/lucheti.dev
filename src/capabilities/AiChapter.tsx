import type { ReactNode } from "react";
import type { Ai, Capabilities, Stat } from "@/content";
import { Chapter } from "@/story";
import { Container, DomainHeader, RepoCards, SkillList, SubsectionHeader } from "@/ui";
import { CaseStudyCard } from "./CaseStudyCard";
import { AgentAtWorkPanel } from "./agent/AgentAtWorkPanel";

type AiChapterProps = Readonly<{
  ai: Ai;
  capabilities: Capabilities;
  /** The figures shown on the case-study card. */
  stats: readonly Stat[];
}>;

/** AI: its heading and a compact skill list beside the agent, then repositories and Orchestra, the featured project with its own page. */
export function AiChapter({ ai, capabilities, stats }: AiChapterProps): ReactNode {
  const { subsections } = capabilities;
  return (
    <Chapter id="ai" className="relative bg-paper py-32 lg:py-48">
      <Container className="relative flex flex-col gap-24 lg:gap-36">
        <DomainHeader
          heading={ai.heading}
          intro={ai.intro}
          panel={<AgentAtWorkPanel panel={ai.panel} />}
          aside={<SkillList areas={ai.areas} label={`${ai.heading} skills`} />}
        />
        <section aria-labelledby="ai-repos">
          <SubsectionHeader id="ai-repos" title={subsections.repos.title} caption={subsections.repos.caption} />
          <RepoCards repos={ai.repos} labels={capabilities.repoLabels} />
        </section>
        <section aria-labelledby="ai-case-study">
          <SubsectionHeader id="ai-case-study" title={ai.caseStudy.title} caption={ai.caseStudy.caption} />
          <CaseStudyCard study={ai.caseStudy} stats={stats} />
        </section>
      </Container>
    </Chapter>
  );
}
