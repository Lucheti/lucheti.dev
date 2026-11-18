import type { ReactNode } from "react";
import type { Capabilities, Craft } from "@/content";
import { Chapter } from "@/story";
import { Container, DomainHeader, RepoCards, SkillList, SubsectionHeader } from "@/ui";
import { LaptopPanel } from "./LaptopPanel";

type CraftChapterProps = Readonly<{ craft: Craft; capabilities: Capabilities }>;

/** The front end: its heading and a compact skill list beside the laptop corner, then repositories. */
export function CraftChapter({ craft, capabilities }: CraftChapterProps): ReactNode {
  const { subsections } = capabilities;
  return (
    <Chapter id="craft" className="relative bg-paper-raised py-32 lg:py-48">
      <Container className="relative flex flex-col gap-24 lg:gap-36">
        <DomainHeader
          heading={craft.heading}
          intro={craft.intro}
          panel={<LaptopPanel laptop={craft.laptop} />}
          aside={<SkillList areas={craft.areas} label={`${craft.heading} skills`} />}
        />
        <section aria-labelledby="craft-repos">
          <SubsectionHeader id="craft-repos" title={subsections.repos.title} caption={subsections.repos.caption} />
          <RepoCards repos={craft.repos} labels={capabilities.repoLabels} />
        </section>
      </Container>
    </Chapter>
  );
}
