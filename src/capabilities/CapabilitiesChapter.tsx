import type { ReactNode } from "react";
import type { Ai, Capabilities, Craft, Systems } from "@/content";
import { Chapter } from "@/story";
import { Container, Reveal } from "@/ui";
import { buildCapabilityIndex, type CapabilityRow } from "./CapabilityIndex";

type CapabilitiesChapterProps = Readonly<{
  capabilities: Capabilities;
  craft: Craft;
  systems: Systems;
  ai: Ai;
}>;

const LABEL_CAPS = "font-label font-medium text-[11px] uppercase tracking-[0.16em]";

function IndexRow({ row }: { readonly row: CapabilityRow }): ReactNode {
  return (
    <li className="border-b border-line-dark first:border-t">
      <a
        href={`#${row.chapter}`}
        className="group flex items-center gap-5 py-6 outline-offset-4 md:gap-8 md:py-8"
      >
        <span aria-hidden className="w-14 shrink-0 font-dot text-3xl text-signal md:w-20 md:text-5xl">
          {row.number}
        </span>
        <span className="font-display text-3xl font-semibold tracking-[-0.04em] text-fog transition-colors duration-300 group-hover:text-signal group-focus-visible:text-signal md:text-5xl">
          {row.name}
        </span>
        <span className="hidden min-w-0 flex-1 truncate text-right font-label text-xs text-fog-dim md:block">
          {row.preview.join(" · ")}
        </span>
        <span
          aria-hidden
          className="ml-auto font-display text-3xl text-fog transition-[color,transform] duration-300 group-hover:translate-x-1 group-hover:text-signal group-focus-visible:text-signal md:ml-0 md:text-4xl"
        >
          →
        </span>
      </a>
    </li>
  );
}

/** The landmark after the build log: everything below it is what Lucas can do, indexed by domain. */
export function CapabilitiesChapter({ capabilities, craft, systems, ai }: CapabilitiesChapterProps): ReactNode {
  const rows = buildCapabilityIndex([
    { chapter: "craft", domain: craft },
    { chapter: "systems", domain: systems },
    { chapter: "ai", domain: ai },
  ]);

  return (
    <Chapter id="capabilities" className="relative flex min-h-dvh flex-col bg-graphite py-16 text-fog lg:py-20">
      <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-signal" />
      <Container className="flex flex-1 flex-col justify-between gap-12">
        <div className={`flex items-center justify-between text-fog-dim ${LABEL_CAPS}`}>
          <p>{capabilities.label}</p>
          <p>{capabilities.range}</p>
        </div>

        <div className="flex flex-col gap-8">
          <div className="@container">
            <h2 className="font-display text-[length:15cqw] font-bold leading-[0.9] tracking-[-0.06em] text-fog lg:text-[length:min(15cqw,22dvh)]">
              {capabilities.heading}
            </h2>
          </div>
          <Reveal>
            <p className="max-w-[34rem] text-base leading-[1.6] text-fog-dim md:text-lg">{capabilities.intro}</p>
          </Reveal>
        </div>

        <Reveal>
          <nav aria-label={capabilities.label}>
            <ul>
              {rows.map((row) => (
                <IndexRow key={row.chapter} row={row} />
              ))}
            </ul>
          </nav>
        </Reveal>
      </Container>
    </Chapter>
  );
}
