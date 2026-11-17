import type { ReactNode } from "react";
import type { Ai } from "@/content";
import { Chapter } from "@/story";
import { Container, SectionHeader, SkillTable } from "@/ui";

/** Chapter 05: AI as a skill table. The pinned Orchestra chapter that follows is its exhibit. */
export function AiChapter({ ai }: { readonly ai: Ai }): ReactNode {
  return (
    <Chapter id="ai" className="bg-paper pb-24 pt-32 lg:pb-32 lg:pt-48">
      <Container className="flex flex-col gap-14 lg:gap-20">
        <SectionHeader index="05" label={ai.label} heading={ai.heading} intro={ai.intro} />
        <SkillTable areas={ai.areas} caption={`${ai.heading} skills`} />
      </Container>
    </Chapter>
  );
}
