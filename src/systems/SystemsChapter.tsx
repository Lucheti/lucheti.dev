import type { ReactNode } from "react";
import type { Capabilities, Systems } from "@/content";
import { Chapter } from "@/story";
import { Container, DomainHeader, RepoCards, SkillTable, SubsectionHeader } from "@/ui";
import { RequestPanel } from "./RequestPanel";

type SystemsChapterProps = Readonly<{ systems: Systems; capabilities: Capabilities }>;

/** The back end in two parts: its skills and the repositories behind them. */
export function SystemsChapter({ systems, capabilities }: SystemsChapterProps): ReactNode {
  const { subsections } = capabilities;
  return (
    <Chapter id="systems" className="relative bg-paper-sunk py-32 lg:py-48">
      <Container className="relative flex flex-col gap-24 lg:gap-36">
        <DomainHeader heading={systems.heading} intro={systems.intro} panel={<RequestPanel panel={systems.panel} />} />
        <section aria-labelledby="systems-skills">
          <SubsectionHeader id="systems-skills" title={subsections.skills.title} caption={subsections.skills.caption} />
          <SkillTable areas={systems.areas} caption={`${systems.heading} skills`} />
        </section>
        <section aria-labelledby="systems-repos">
          <SubsectionHeader id="systems-repos" title={subsections.repos.title} caption={subsections.repos.caption} />
          <RepoCards repos={systems.repos} labels={capabilities.repoLabels} surface="raised" />
        </section>
      </Container>
    </Chapter>
  );
}
