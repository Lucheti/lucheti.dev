import type { ReactNode } from "react";
import type { Capabilities, Systems } from "@/content";
import { Chapter } from "@/story";
import { Container, DomainBackdrop, RepoCards, SectionHeader, SkillTable, SubsectionHeader, twoDigits } from "@/ui";

type SystemsChapterProps = Readonly<{ systems: Systems; capabilities: Capabilities }>;

/** Chapter 04: the back end as two numbered parts, its skills and the repositories behind them. */
export function SystemsChapter({ systems, capabilities }: SystemsChapterProps): ReactNode {
  const { subsections, countUnits } = capabilities;
  return (
    <Chapter id="systems" className="relative bg-paper-sunk py-32 lg:py-48">
      <DomainBackdrop kind="backend" />
      <Container className="relative flex flex-col gap-24 lg:gap-36">
        <SectionHeader index="04" label={systems.label} heading={systems.heading} intro={systems.intro} />
        <section aria-labelledby="systems-skills">
          <SubsectionHeader
            id="systems-skills"
            number="04.1"
            title={subsections.skills.title}
            caption={subsections.skills.caption}
            count={`${twoDigits(systems.areas.length)} ${countUnits.areas}`}
          />
          <SkillTable areas={systems.areas} caption={`${systems.heading} skills`} />
        </section>
        <section aria-labelledby="systems-repos">
          <SubsectionHeader
            id="systems-repos"
            number="04.2"
            title={subsections.repos.title}
            caption={subsections.repos.caption}
            count={`${twoDigits(systems.repos.length)} ${countUnits.repos}`}
          />
          <RepoCards repos={systems.repos} labels={capabilities.repoLabels} surface="raised" />
        </section>
      </Container>
    </Chapter>
  );
}
