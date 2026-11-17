import type { ReactNode } from "react";
import type { FrameSequence, Orchestra, OrchestraPage } from "@/content";
import { OrchestraBoardSection } from "@/orchestra";
import { Container, SubsectionHeader } from "@/ui";

type CaseDemoProps = Readonly<{
  demo: OrchestraPage["demo"];
  orchestra: Orchestra;
  sequence: FrameSequence;
}>;

/** Part 01: a short header on paper, then the pinned board. */
export function CaseDemo({ demo, orchestra, sequence }: CaseDemoProps): ReactNode {
  return (
    <>
      <div className="bg-paper">
        <Container>
          <SubsectionHeader id="case-demo" number={demo.number} title={demo.title} caption={demo.caption} />
        </Container>
      </div>
      <OrchestraBoardSection orchestra={orchestra} sequence={sequence} />
    </>
  );
}
