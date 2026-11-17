import type { ReactNode } from "react";
import type { Ai, Capabilities, Craft, Systems } from "@/content";
import { Chapter } from "@/story";
import { Container, Reveal, ToolPills } from "@/ui";
import { buildCapabilityIndex, type CapabilityRow } from "./CapabilityIndex";

type CapabilitiesChapterProps = Readonly<{
  capabilities: Capabilities;
  craft: Craft;
  systems: Systems;
  ai: Ai;
}>;

/** One domain as a link card: its name in the accent and the first tools it uses. */
function IndexCard({ row }: { readonly row: CapabilityRow }): ReactNode {
  return (
    <li className="min-w-0">
      <a
        href={`#${row.chapter}`}
        className="group flex h-full flex-col rounded-lg border border-line-dark bg-graphite-raised p-6 transition-colors duration-300 hover:border-signal focus-visible:border-signal lg:p-7"
      >
        <span className="flex items-baseline justify-between gap-4">
          <span className="font-display text-3xl font-semibold tracking-[-0.04em] text-signal md:text-4xl">{row.name}</span>
          <span
            aria-hidden
            className="font-display text-2xl leading-none text-fog-dim transition-[color,transform] duration-300 group-hover:translate-x-1 group-hover:text-signal group-focus-visible:translate-x-1 group-focus-visible:text-signal"
          >
            →
          </span>
        </span>
        <ToolPills tools={row.preview} tone="dark" className="mt-8" />
      </a>
    </li>
  );
}

/** The landmark after the build log: a compact band that indexes the three domains below it. */
export function CapabilitiesChapter({ capabilities, craft, systems, ai }: CapabilitiesChapterProps): ReactNode {
  const rows = buildCapabilityIndex([
    { chapter: "craft", domain: craft },
    { chapter: "systems", domain: systems },
    { chapter: "ai", domain: ai },
  ]);

  return (
    <Chapter id="capabilities" className="relative bg-graphite py-20 text-fog lg:py-28">
      <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-signal" />
      <Container className="flex flex-col gap-12 lg:gap-16">
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:items-end lg:gap-x-10">
          <h2 className="font-display text-[clamp(3.5rem,9vw,8.5rem)] font-bold leading-[0.88] tracking-[-0.06em] text-fog lg:col-span-7">
            {capabilities.heading}
          </h2>
          <Reveal className="lg:col-span-5 lg:pb-3">
            <p className="max-w-[34rem] text-base leading-[1.6] text-fog-dim md:text-lg">{capabilities.intro}</p>
          </Reveal>
        </div>

        <Reveal>
          <nav aria-label={capabilities.heading}>
            <ul className="grid gap-4 lg:grid-cols-3">
              {rows.map((row) => (
                <IndexCard key={row.chapter} row={row} />
              ))}
            </ul>
          </nav>
        </Reveal>
      </Container>
    </Chapter>
  );
}
