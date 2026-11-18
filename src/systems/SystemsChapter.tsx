import type { ReactNode } from "react";
import type { Capabilities, Systems } from "@/content";
import { Chapter } from "@/story";
import { Container, DomainHeader, RepoCards, SkillList, SubsectionHeader } from "@/ui";
import { QueueDiorama } from "./QueueDiorama";

type SystemsChapterProps = Readonly<{ systems: Systems; capabilities: Capabilities }>;

/** The back end: its heading and a compact skill list beside the queue diorama, then repositories. */
export function SystemsChapter({ systems, capabilities }: SystemsChapterProps): ReactNode {
  const { subsections } = capabilities;
  return (
    <Chapter id="systems" className="relative bg-paper-sunk py-32 lg:py-48">
      <Container className="relative flex flex-col gap-24 lg:gap-36">
        <DomainHeader
          heading={systems.heading}
          intro={systems.intro}
          panel={<QueueDiorama panel={systems.panel} />}
          aside={<SkillList areas={systems.areas} label={`${systems.heading} skills`} />}
        />
        <section aria-labelledby="systems-repos">
          <SubsectionHeader id="systems-repos" title={subsections.repos.title} caption={subsections.repos.caption} />
          <RepoCards repos={systems.repos} labels={capabilities.repoLabels} />
        </section>
      </Container>
    </Chapter>
  );
}
