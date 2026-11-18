import type { ReactNode } from "react";
import { cx } from "./cx";
import { Reveal } from "./Reveal";
import { SectionHeader } from "./SectionHeader";

/** The colour of the stage the feature panel stands on, taken from the panel itself. */
export type StageTone = "peach" | "sky" | "lilac";

const STAGE_GROUNDS: Readonly<Record<StageTone, string>> = {
  // The MacBook's warm wallpaper.
  peach: "bg-[linear-gradient(160deg,#ffe4cf_0%,#ffc49b_100%)]",
  // Infrastructure blue.
  sky: "bg-[linear-gradient(160deg,#dde8ff_0%,#b3c9fa_100%)]",
  // The Orchestra office's lilac floor.
  lilac: "bg-[linear-gradient(160deg,#eee5ff_0%,#cdbbf8_100%)]",
};

type DomainHeaderProps = Readonly<{
  heading: string;
  intro: string;
  /** The domain's feature panel; it sits right of the heading on lg and under the intro below that. */
  panel: ReactNode;
  /** Optional compact content under the intro on lg (e.g. a skill list); below the panel on smaller screens. */
  aside?: ReactNode;
  /**
   * A coloured stage behind the panel on lg: from the chapter's top edge to its bottom and off the right edge
   * of the page. The chapter must clip its overflow.
   */
  stage?: StageTone;
}>;

/**
 * Opens a domain chapter: heading and intro on the left (5 of 12 columns), its feature panel on the right (7).
 * An aside, when given, stacks under the intro in the left column and comes after the panel on phones. With
 * an aside, the panel's top lines up with the top of the heading; without one, the two are centred.
 */
export function DomainHeader({ heading, intro, panel, aside, stage }: DomainHeaderProps): ReactNode {
  const stacked = aside !== undefined;
  return (
    <div
      className={cx(
        "isolate flex flex-col gap-12 lg:grid lg:grid-cols-12 lg:gap-x-10 lg:gap-y-10 xl:gap-x-16",
        stacked ? "lg:items-start" : "lg:items-center",
      )}
    >
      {stage === undefined ? null : (
        <div aria-hidden className="pointer-events-none relative -z-10 hidden self-stretch lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:block">
          {/* Up to the chapter's top edge (its lg padding), and far past its bottom and the page's right edge; the chapter clips it. */}
          <div className={cx("absolute -bottom-[100vh] -left-6 -right-[100vw] -top-48", STAGE_GROUNDS[stage])} />
        </div>
      )}
      <div className="lg:col-span-5">
        <SectionHeader heading={heading} intro={intro} />
      </div>
      <Reveal delay={0.12} className="min-w-0 lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1">
        {panel}
      </Reveal>
      {stacked ? (
        <Reveal delay={0.2} className="min-w-0 lg:col-span-5 lg:col-start-1 lg:row-start-2">
          {aside}
        </Reveal>
      ) : null}
    </div>
  );
}
