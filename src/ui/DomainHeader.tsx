import type { ReactNode } from "react";
import { Reveal } from "./Reveal";
import { SectionHeader } from "./SectionHeader";

type DomainHeaderProps = Readonly<{
  heading: string;
  intro: string;
  /** The domain's feature panel; it sits right of the heading on lg and under the intro below that. */
  panel: ReactNode;
}>;

/** Opens a domain chapter: heading and intro on the left (5 of 12 columns), its feature panel on the right (7). */
export function DomainHeader({ heading, intro, panel }: DomainHeaderProps): ReactNode {
  return (
    <div className="flex flex-col gap-12 lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-10 xl:gap-x-16">
      <div className="lg:col-span-5">
        <SectionHeader heading={heading} intro={intro} />
      </div>
      <Reveal delay={0.12} className="min-w-0 lg:col-span-7">
        {panel}
      </Reveal>
    </div>
  );
}
