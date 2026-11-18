import type { ReactNode } from "react";
import type { Ai, Capabilities } from "@/content";
import { Chapter } from "@/story";
import { ColumnBlock, Container, DomainHeader, RepoList, SkillList } from "@/ui";
import { OfficeDiorama } from "./OfficeDiorama";

type AiChapterProps = Readonly<{ ai: Ai; capabilities: Capabilities }>;

/** AI: its heading, reference projects and skills in one column beside the Orchestra office; Orchestra's card points to its own page. */
export function AiChapter({ ai, capabilities }: AiChapterProps): ReactNode {
  const { subsections } = capabilities;
  return (
    <Chapter id="ai" className="relative bg-paper py-32 lg:py-48">
      <Container className="relative flex flex-col gap-24 lg:gap-36">
        <DomainHeader
          heading={ai.heading}
          intro={ai.intro}
          panel={<OfficeDiorama office={ai.office} panel={ai.panel} />}
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
