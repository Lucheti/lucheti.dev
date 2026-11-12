import type { ReactNode } from "react";
import type { Systems } from "@/content";
import { Chapter } from "@/story";
import { BulletList, Chip, Container, SectionHeader } from "@/ui";
import { SagaDiagram } from "./SagaDiagram";

/** Chapter 04: the back end, shown as a saga the visitor can break. */
export function SystemsChapter({ systems }: { readonly systems: Systems }): ReactNode {
  return (
    <Chapter id="systems" className="bg-paper-sunk py-32 lg:py-48">
      <Container className="flex flex-col gap-16 lg:gap-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <SectionHeader index="04" label={systems.label} heading={systems.heading} intro={systems.intro} />
          </div>
          <div className="lg:col-span-5">
            <BulletList items={systems.principles} />
          </div>
        </div>

        <SagaDiagram systems={systems} />

        <ul className="flex flex-wrap gap-2" aria-label={systems.label}>
          {systems.stack.map((item) => (
            <li key={item}>
              <Chip>{item}</Chip>
            </li>
          ))}
        </ul>
      </Container>
    </Chapter>
  );
}
