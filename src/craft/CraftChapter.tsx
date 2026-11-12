import type { ReactNode } from "react";
import type { Craft } from "@/content";
import { Chapter } from "@/story";
import { Chip, Container, SectionHeader } from "@/ui";
import { SpecWorkbench } from "./SpecWorkbench";

/** Chapter 03: the front end, proved by a specimen whose spec the visitor can switch on. */
export function CraftChapter({ craft }: { readonly craft: Craft }): ReactNode {
  return (
    <Chapter id="craft" className="bg-paper-raised py-32 lg:py-48">
      <Container>
        <SpecWorkbench
          craft={craft}
          header={<SectionHeader index="03" label={craft.label} heading={craft.heading} intro={craft.intro} />}
          stack={
            <ul className="flex flex-wrap gap-2" aria-label={craft.label}>
              {craft.stack.map((item) => (
                <li key={item}>
                  <Chip>{item}</Chip>
                </li>
              ))}
            </ul>
          }
        />
      </Container>
    </Chapter>
  );
}
