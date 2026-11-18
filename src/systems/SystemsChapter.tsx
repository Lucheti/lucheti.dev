import type { ReactNode } from "react";
import type { Capabilities, Systems } from "@/content";
import { Chapter } from "@/story";
import { ColumnBlock, Container, DomainHeader, RepoList, SkillList } from "@/ui";
import { ServiceMapPanel } from "./ServiceMapPanel";

type SystemsChapterProps = Readonly<{ systems: Systems; capabilities: Capabilities }>;

/**
 * The back end: its heading, reference projects and skills in one column beside the service map in the
 * laptop's top-right corner. The 3D queue diorama (`QueueDiorama`) is parked: kept whole, rendered nowhere.
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
            <div className="flex flex-col gap-10">
              <ColumnBlock id="systems-repos" title={subsections.repos.title}>
                <RepoList repos={systems.repos} labels={capabilities.repoLabels} />
              </ColumnBlock>
              <ColumnBlock id="systems-skills" title={subsections.skills.title}>
                <SkillList areas={systems.areas} label={`${systems.heading} skills`} />
              </ColumnBlock>
            </div>
          }
        />
      </Container>
    </Chapter>
  );
}
