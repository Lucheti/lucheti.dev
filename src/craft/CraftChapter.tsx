import type { ReactNode } from "react";
import type { Capabilities, Craft } from "@/content";
import { Chapter } from "@/story";
import { Container, RepoCards, SkillTable, SubsectionHeader } from "@/ui";
import { SpecWorkbench } from "./SpecWorkbench";
import { WorkbenchRoom } from "./WorkbenchRoom";

type CraftChapterProps = Readonly<{ craft: Craft; capabilities: Capabilities }>;

/** The front end: the workbench room it opens on, then skills, repositories, and a specimen whose spec the visitor can switch on. */
export function CraftChapter({ craft, capabilities }: CraftChapterProps): ReactNode {
  const { subsections } = capabilities;
  return (
    <Chapter id="craft" className="relative bg-paper-raised pb-32 lg:pb-48">
      <WorkbenchRoom heading={craft.heading} intro={craft.intro} room={craft.room} />
      <Container className="relative flex flex-col gap-24 pt-16 lg:gap-36 lg:pt-8">
        <section aria-labelledby="craft-skills">
          <SubsectionHeader id="craft-skills" title={subsections.skills.title} caption={subsections.skills.caption} />
          <SkillTable areas={craft.areas} caption={`${craft.heading} skills`} />
        </section>
        <section aria-labelledby="craft-repos">
          <SubsectionHeader id="craft-repos" title={subsections.repos.title} caption={subsections.repos.caption} />
          <RepoCards repos={craft.repos} labels={capabilities.repoLabels} surface="paper" />
        </section>
        <section aria-labelledby="craft-demo">
          <SubsectionHeader id="craft-demo" title={subsections.demo.title} caption={subsections.demo.caption} />
          <SpecWorkbench
            craft={craft}
            header={<p className="max-w-[34rem] text-base leading-[1.55] text-ink-soft">{craft.demoCaption}</p>}
          />
        </section>
      </Container>
    </Chapter>
  );
}
