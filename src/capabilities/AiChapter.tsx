import type { ReactNode } from "react";
import type { Ai } from "@/content";
import { Chapter } from "@/story";
import { Container, ExhibitHeader, SectionHeader, SkillTable } from "@/ui";

/** Chapter 05: AI as a skill table, ending with the header of the pinned Orchestra exhibit that follows. */
export function AiChapter({ ai }: { readonly ai: Ai }): ReactNode {
  return (
    <Chapter id="ai" className="bg-paper py-32 lg:py-48">
      <Container className="flex flex-col gap-14 lg:gap-20">
        <SectionHeader index="05" label={ai.label} heading={ai.heading} intro={ai.intro} />
        <SkillTable areas={ai.areas} caption={`${ai.heading} skills`} />
        <ExhibitHeader exhibit={ai.exhibit} className="mt-10 lg:mt-16" />
      </Container>
    </Chapter>
  );
}
