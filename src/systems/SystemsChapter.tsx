import type { ReactNode } from "react";
import type { Capabilities, Systems } from "@/content";
import { Chapter } from "@/story";
import { ColumnBlock, Container, DomainHeader, RepoCards, SkillList, SubsectionHeader } from "@/ui";
import { ServiceMapPanel } from "./ServiceMapPanel";

type SystemsChapterProps = Readonly<{ systems: Systems; capabilities: Capabilities }>;

/**
 * The back end: its heading and a compact skill list beside the service map in the laptop's top-right
 * corner, then repositories. The 3D queue diorama (`QueueDiorama`) is parked: kept whole, rendered nowhere.
 */
export function SystemsChapter({ systems, capabilities }: SystemsChapterProps): ReactNode {
  const { subsections } = capabilities;
  return (
    <Chapter id="systems" className="relative bg-paper-sunk py-32 lg:py-48">
      <Container className="relative flex flex-col gap-24 lg:gap-36">
        <DomainHeader
          heading={systems.heading}
          intro={systems.intro}
          panel={<ServiceMapPanel map={systems.map} />}
          aside={
            <ColumnBlock id="systems-skills" title={subsections.skills.title}>
              <SkillList areas={systems.areas} label={`${systems.heading} skills`} />
            </ColumnBlock>
          }
        />
        <section aria-labelledby="systems-repos">
          <SubsectionHeader id="systems-repos" title={subsections.repos.title} caption={subsections.repos.caption} />
          <RepoCards repos={systems.repos} labels={capabilities.repoLabels} />
        </section>
      </Container>
    </Chapter>
  );
}
