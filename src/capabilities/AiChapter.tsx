import type { ReactNode } from "react";
import type { Ai, Capabilities } from "@/content";
import { Chapter } from "@/story";
import { ColumnBlock, Container, DomainHeader, RepoList, SkillList } from "@/ui";
import { AgentSessionPanel } from "./AgentSessionPanel";

type AiChapterProps = Readonly<{ ai: Ai; capabilities: Capabilities }>;

/**
 * AI: its heading, reference projects and skills in one column beside the agent session window in its
 * top-right corner; Orchestra's card points to its own page. The Orchestra office (`OfficeDiorama`) is
 * parked: kept whole, rendered nowhere.
 */
export function AiChapter({ ai, capabilities }: AiChapterProps): ReactNode {
  const { subsections } = capabilities;
  return (
    <Chapter id="ai" className="relative overflow-hidden bg-paper py-32 lg:py-48">
      <Container className="relative flex flex-col gap-24 lg:gap-36">
        <DomainHeader
          stage="lilac"
          heading={ai.heading}
          intro={ai.intro}
          panel={<AgentSessionPanel session={ai.session} />}
          aside={
            <div className="flex flex-col gap-10">
              <ColumnBlock id="ai-repos" title={subsections.repos.title}>
                <RepoList repos={ai.repos} labels={capabilities.repoLabels} />
              </ColumnBlock>
              <ColumnBlock id="ai-skills" title={subsections.skills.title}>
                <SkillList areas={ai.areas} label={`${ai.heading} skills`} />
              </ColumnBlock>
            </div>
          }
        />
      </Container>
    </Chapter>
  );
}
