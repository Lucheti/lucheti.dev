import type { ReactNode } from "react";
import type { Ai, Capabilities } from "@/content";
import { Chapter } from "@/story";
import { Container, DomainHeader, RepoCards, SkillList, SubsectionHeader } from "@/ui";
import { OfficeDiorama } from "./OfficeDiorama";

type AiChapterProps = Readonly<{ ai: Ai; capabilities: Capabilities }>;

/** AI: its heading and a compact skill list beside the Orchestra office, then repositories; Orchestra's card points to its own page. */
export function AiChapter({ ai, capabilities }: AiChapterProps): ReactNode {
  const { subsections } = capabilities;
  return (
    <Chapter id="ai" className="relative bg-paper py-32 lg:py-48">
      <Container className="relative flex flex-col gap-24 lg:gap-36">
        <DomainHeader
          heading={ai.heading}
          intro={ai.intro}
          panel={<OfficeDiorama office={ai.office} panel={ai.panel} />}
          aside={<SkillList areas={ai.areas} label={`${ai.heading} skills`} />}
        />
        <section aria-labelledby="ai-repos">
          <SubsectionHeader id="ai-repos" title={subsections.repos.title} caption={subsections.repos.caption} />
          <RepoCards repos={ai.repos} labels={capabilities.repoLabels} />
        </section>
      </Container>
    </Chapter>
  );
}
