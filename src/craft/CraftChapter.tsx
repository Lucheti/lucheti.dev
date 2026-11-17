import type { ReactNode } from "react";
import type { Craft } from "@/content";
import { Chapter } from "@/story";
import { Container, ExhibitHeader, SectionHeader, SkillTable } from "@/ui";
import { SpecWorkbench } from "./SpecWorkbench";

/** Chapter 03: the front end as a skill table, then a specimen whose spec the visitor can switch on. */
export function CraftChapter({ craft }: { readonly craft: Craft }): ReactNode {
  return (
    <Chapter id="craft" className="bg-paper-raised py-32 lg:py-48">
      <Container>
        <div className="flex flex-col gap-14">
          <SectionHeader index="03" label={craft.label} heading={craft.heading} intro={craft.intro} />
          <SkillTable areas={craft.areas} caption={`${craft.heading} skills`} />
        </div>
        <div className="mt-24 lg:mt-32">
          <SpecWorkbench craft={craft} header={<ExhibitHeader exhibit={craft.exhibit} />} />
        </div>
      </Container>
    </Chapter>
  );
}
