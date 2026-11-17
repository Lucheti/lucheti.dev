import type { ReactNode } from "react";
import type { Capabilities, Craft } from "@/content";
import { Chapter } from "@/story";
import { Container, RepoCards, SectionHeader, SkillTable, SubsectionHeader, twoDigits } from "@/ui";
import { SpecWorkbench } from "./SpecWorkbench";

type CraftChapterProps = Readonly<{ craft: Craft; capabilities: Capabilities }>;

/** Chapter 03: the front end as numbered parts: skills, repositories, and a specimen whose spec the visitor can switch on. */
export function CraftChapter({ craft, capabilities }: CraftChapterProps): ReactNode {
  const { subsections, countUnits } = capabilities;
  return (
    <Chapter id="craft" className="bg-paper-raised py-32 lg:py-48">
      <Container className="flex flex-col gap-24 lg:gap-36">
        <SectionHeader index="03" label={craft.label} heading={craft.heading} intro={craft.intro} />
        <section aria-labelledby="craft-skills">
          <SubsectionHeader
            id="craft-skills"
            number="03.1"
            title={subsections.skills.title}
            caption={subsections.skills.caption}
            count={`${twoDigits(craft.areas.length)} ${countUnits.areas}`}
          />
          <SkillTable areas={craft.areas} caption={`${craft.heading} skills`} />
        </section>
        <section aria-labelledby="craft-repos">
          <SubsectionHeader
            id="craft-repos"
            number="03.2"
            title={subsections.repos.title}
            caption={subsections.repos.caption}
            count={`${twoDigits(craft.repos.length)} ${countUnits.repos}`}
          />
          <RepoCards repos={craft.repos} labels={capabilities.repoLabels} surface="paper" />
        </section>
        <section aria-labelledby="craft-demo">
          <SubsectionHeader
            id="craft-demo"
            number="03.3"
            title={subsections.demo.title}
            caption={subsections.demo.caption}
          />
          <SpecWorkbench
            craft={craft}
            header={<p className="max-w-[34rem] text-base leading-[1.55] text-ink-soft">{craft.demoCaption}</p>}
          />
        </section>
      </Container>
    </Chapter>
  );
}
