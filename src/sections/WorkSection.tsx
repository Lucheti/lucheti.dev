import type { ReactNode } from "react";
import type { Work } from "@/content";
import { Chapter } from "@/story";
import { Container, LeftColumn, Reveal, SectionHeader } from "@/ui";
import { CaseCard } from "./CaseCard";

export function WorkSection({ work }: { readonly work: Work }): ReactNode {
  return (
    <Chapter id="work" className="py-28 lg:py-44">
      <Container>
        <LeftColumn className="flex flex-col gap-14 lg:gap-20">
          <SectionHeader label={work.label} heading={work.heading} intro={work.intro} />
          <div className="flex flex-col gap-6">
            {work.cases.map((study) => (
              <Reveal key={study.company}>
                <CaseCard study={study} />
              </Reveal>
            ))}
          </div>
        </LeftColumn>
      </Container>
    </Chapter>
  );
}
