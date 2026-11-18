import type { ReactNode } from "react";
import type { Capabilities, Craft } from "@/content";
import { Chapter } from "@/story";
import { ColumnBlock, Container, DomainHeader, RepoList, SkillList } from "@/ui";
import { LaptopPanel } from "./LaptopPanel";

type CraftChapterProps = Readonly<{ craft: Craft; capabilities: Capabilities }>;

/** The front end: its heading, reference projects and skills in one column beside the laptop corner. */
export function CraftChapter({ craft, capabilities }: CraftChapterProps): ReactNode {
  const { subsections } = capabilities;
  return (
    <Chapter id="craft" className="relative overflow-hidden bg-paper-raised py-32 lg:py-48">
      <Container className="relative flex flex-col gap-24 lg:gap-36">
        <DomainHeader
          stage="peach"
          side="left"
          heading={craft.heading}
          intro={craft.intro}
          panel={<LaptopPanel laptop={craft.laptop} />}
          aside={
            <div className="flex flex-col gap-10">
              <ColumnBlock id="craft-repos" title={subsections.repos.title}>
                <RepoList repos={craft.repos} labels={capabilities.repoLabels} />
              </ColumnBlock>
              <ColumnBlock id="craft-skills" title={subsections.skills.title}>
                <SkillList areas={craft.areas} label={`${craft.heading} skills`} />
              </ColumnBlock>
            </div>
          }
        />
      </Container>
    </Chapter>
  );
}
