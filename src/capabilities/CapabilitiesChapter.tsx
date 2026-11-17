import type { CSSProperties, ReactNode } from "react";
import type { Ai, Capabilities, Craft, Systems } from "@/content";
import { Chapter } from "@/story";
import { Container, cx, Reveal, toolIcon, ToolPill } from "@/ui";
import { ToolWall } from "./ToolWall";

type CapabilitiesChapterProps = Readonly<{
  capabilities: Capabilities;
  craft: Craft;
  systems: Systems;
  ai: Ai;
}>;

const WALL_ROWS = 2;

/** Soft edges, so pills slide in and out instead of being cut at the container. */
const EDGE_FADE = "[mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]";

/** Seconds per loop, scaled to the row so every row moves at the same speed. */
function loopSeconds(tools: readonly string[]): number {
  return Math.max(30, tools.length * 2.6);
}

function PillRun({ tools, hidden }: { readonly tools: readonly string[]; readonly hidden: boolean }): ReactNode {
  return (
    <ul aria-hidden={hidden || undefined} className={cx("flex shrink-0 gap-3 motion-reduce:flex-wrap", hidden && "motion-reduce:hidden")}>
      {tools.map((tool) => (
        <li key={tool} className="flex">
          <ToolPill tool={tool} tone="dark" size="lg" />
        </li>
      ))}
    </ul>
  );
}

/**
 * One row of the wall: the run of pills twice, side by side, sliding by exactly one run plus the gap so the
 * loop is seamless. It pauses on hover, and under reduced motion it stops and wraps.
 */
function WallRow({ tools, reverse }: { readonly tools: readonly string[]; readonly reverse: boolean }): ReactNode {
  return (
    <div className={cx("group/row overflow-hidden py-1 motion-reduce:overflow-visible", EDGE_FADE, "motion-reduce:[mask-image:none]")}>
      <div
        className={cx(
          "flex w-max gap-3 motion-safe:animate-[wall-slide_var(--wall-loop)_linear_infinite] group-hover/row:[animation-play-state:paused]",
          "motion-reduce:w-auto",
        )}
        // Inline, because the animation shorthand from the class would reset a direction set by another class.
        style={{ "--wall-loop": `${loopSeconds(tools)}s`, animationDirection: reverse ? "reverse" : undefined } as CSSProperties}
      >
        <PillRun tools={tools} hidden={false} />
        <PillRun tools={tools} hidden />
      </div>
    </div>
  );
}

/** The landmark after the build log: the title, one line, and a wall of every tool used in the chapters below. */
export function CapabilitiesChapter({ capabilities, craft, systems, ai }: CapabilitiesChapterProps): ReactNode {
  const wall = ToolWall.of([craft, systems, ai], WALL_ROWS, (tool) => toolIcon(tool) !== undefined);

  return (
    <Chapter id="capabilities" className="relative overflow-hidden bg-graphite py-20 text-fog lg:py-28">
      <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-signal" />
      <Container className="flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:items-end lg:gap-x-10">
        <h2 className="font-display text-[clamp(3.5rem,9vw,8.5rem)] font-bold leading-[0.88] tracking-[-0.06em] text-fog lg:col-span-7">
          {capabilities.heading}
        </h2>
        <Reveal className="lg:col-span-5 lg:pb-3">
          <p className="max-w-[34rem] text-base leading-[1.6] text-fog-dim md:text-lg">{capabilities.intro}</p>
        </Reveal>
      </Container>

      <Reveal className="mt-12 flex flex-col gap-3 lg:mt-16">
        <div role="group" aria-label={capabilities.heading} className="flex flex-col gap-3">
          {wall.rows().map((tools, index) => (
            <WallRow key={tools[0] ?? index} tools={tools} reverse={index % 2 === 1} />
          ))}
        </div>
      </Reveal>
    </Chapter>
  );
}
