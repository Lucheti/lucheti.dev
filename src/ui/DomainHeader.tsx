import type { ReactNode } from "react";
import { Reveal } from "./Reveal";
import { SectionHeader } from "./SectionHeader";

type DomainHeaderProps = Readonly<{
  heading: string;
  intro: string;
  /** The domain's feature panel; it sits right of the heading on lg and under the intro below that. */
  panel: ReactNode;
  /** Optional compact content under the intro on lg (e.g. a skill list); below the panel on smaller screens. */
  aside?: ReactNode;
}>;

/**
 * Opens a domain chapter: heading and intro on the left (5 of 12 columns), its feature panel on the right (7).
 * An aside, when given, stacks under the intro in the left column and comes after the panel on phones.
 */
export function DomainHeader({ heading, intro, panel, aside }: DomainHeaderProps): ReactNode {
  return (
    <div className="flex flex-col gap-12 lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-10 lg:gap-y-10 xl:gap-x-16">
      <div className={aside === undefined ? "lg:col-span-5" : "lg:col-span-5 lg:self-end"}>
        <SectionHeader heading={heading} intro={intro} />
      </div>
      <Reveal delay={0.12} className="min-w-0 lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1">
        {panel}
      </Reveal>
      {aside === undefined ? null : (
        <Reveal delay={0.2} className="min-w-0 lg:col-span-5 lg:col-start-1 lg:row-start-2 lg:self-start">
          {aside}
        </Reveal>
      )}
    </div>
  );
}
