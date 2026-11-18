import type { ReactNode } from "react";
import { cx } from "./cx";
import { Reveal } from "./Reveal";
import { SectionHeader } from "./SectionHeader";

/** The colour of the stage the feature panel stands on, taken from the panel itself. */
export type StageTone = "peach" | "sky" | "lilac";

/** Which side of the chapter the panel and its stage take on lg; the text takes the other. */
export type PanelSide = "right" | "left";

const STAGE_GROUNDS: Readonly<Record<StageTone, string>> = {
  // The MacBook's warm wallpaper.
  peach: "bg-[linear-gradient(160deg,#ffe4cf_0%,#ffc49b_100%)]",
  // Infrastructure blue.
  sky: "bg-[linear-gradient(160deg,#dde8ff_0%,#b3c9fa_100%)]",
  // The Orchestra office's lilac floor.
  lilac: "bg-[linear-gradient(160deg,#eee5ff_0%,#cdbbf8_100%)]",
};

/** Grid placement per side: the panel's 7 columns, the text's 5, and how the stage runs off the page. */
type SideLayout = Readonly<{ panel: string; text: string; stage: string }>;

const SIDES: Readonly<Record<PanelSide, SideLayout>> = {
  // The stage starts exactly at the panel's left edge, where a panel cut on its left meets it, and runs off the right of the page.
  right: { panel: "lg:col-span-7 lg:col-start-6", text: "lg:col-span-5 lg:col-start-1", stage: "left-0 -right-[100vw]" },
  // The mirror: the stage ends exactly at the panel's right edge and runs off the left of the page.
  left: { panel: "lg:col-span-7 lg:col-start-1", text: "lg:col-span-5 lg:col-start-8", stage: "right-0 -left-[100vw]" },
};

type DomainHeaderProps = Readonly<{
  heading: string;
  intro: string;
  /** The domain's feature panel; it sits beside the heading on lg and under the intro below that. */
  panel: ReactNode;
  /** Optional compact content under the intro on lg (e.g. a skill list); below the panel on smaller screens. */
  aside?: ReactNode;
  /**
   * A coloured stage behind the panel on lg: from the chapter's top edge to its bottom and off the page's edge
   * on the panel's side. The chapter must clip its overflow.
   */
  stage?: StageTone;
  /** Which side the panel takes on lg; right by default. */
  side?: PanelSide;
}>;

/**
 * Opens a domain chapter: heading and intro in 5 of 12 columns, its feature panel in the other 7, on either
 * side. An aside, when given, stacks under the intro and comes after the panel on phones. With an aside, the
 * panel's top lines up with the top of the heading; without one, the two are centred.
 */
export function DomainHeader({ heading, intro, panel, aside, stage, side = "right" }: DomainHeaderProps): ReactNode {
  const stacked = aside !== undefined;
  const layout = SIDES[side];
  return (
    <div
      className={cx(
        "isolate flex flex-col gap-12 lg:grid lg:grid-cols-12 lg:gap-x-10 lg:gap-y-10 xl:gap-x-16",
        stacked ? "lg:items-start" : "lg:items-center",
      )}
    >
      {stage === undefined ? null : (
        <div aria-hidden className={cx("pointer-events-none relative -z-10 hidden self-stretch lg:row-span-2 lg:row-start-1 lg:block", layout.panel)}>
          {/* Up to the chapter's top edge (its lg padding), and far past its bottom and the page's edge; the chapter clips it. */}
          <div className={cx("absolute -bottom-[100vh] -top-48", layout.stage, STAGE_GROUNDS[stage])} />
        </div>
      )}
      <div className={cx("lg:row-start-1", layout.text)}>
        <SectionHeader heading={heading} intro={intro} />
      </div>
      <Reveal delay={0.12} className={cx("min-w-0 lg:row-span-2 lg:row-start-1", layout.panel)}>
        {panel}
      </Reveal>
      {stacked ? (
        <Reveal delay={0.2} className={cx("min-w-0 lg:row-start-2", layout.text)}>
          {aside}
        </Reveal>
      ) : null}
    </div>
  );
}
