import type { ReactNode } from "react";
import type { Timeline, TimelineStop } from "@/content";
import { Container, cx, Label, Reveal, SectionHeader } from "@/ui";
import { sideProjectTag } from "./sideProjectTag";
import { splitAtMarker } from "./splitAtMarker";

const INDUSTRY_PREFIX = "The industry:";

function VerticalStop({ stop }: { readonly stop: TimelineStop }): ReactNode {
  const isAi = stop.era === "ai";
  const tag = sideProjectTag(stop);

  return (
    <li className="relative pb-12 pl-8 last:pb-0">
      <span
        aria-hidden
        className={cx(
          "absolute -left-[5.5px] top-3 size-2.5 border",
          stop.kind === "project" ? "border-dashed" : "border-solid",
          isAi ? "border-signal" : "border-ink",
          isAi && stop.kind !== "project" ? "bg-signal" : "bg-paper",
        )}
      />
      <Reveal>
        <p aria-hidden className="font-dot text-[40px] font-semibold leading-none text-mute">
          {stop.year}
        </p>
        <h3 className="mt-3 font-display text-2xl font-semibold leading-[1.05] tracking-[-0.03em] text-ink">
          {stop.company}
        </h3>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-mute">
          {stop.period} · {stop.role}
          {tag !== null && ` · ${tag}`}
        </p>
        <p className="mt-3 max-w-[32ch] text-base leading-[1.5] text-ink">{stop.did}</p>
        <p className="mt-3 max-w-[34ch] text-sm leading-[1.5] text-ink-soft">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-mute">{INDUSTRY_PREFIX}</span>{" "}
          {stop.trend}
        </p>
      </Reveal>
    </li>
  );
}

/** The phone layout: no pin, a vertical axis with the marker as a horizontal orange rule. */
export function VerticalTimeline({ timeline }: { readonly timeline: Timeline }): ReactNode {
  const { before, after } = splitAtMarker(timeline.stops, timeline.marker.afterStop);

  return (
    <div className="bg-paper py-24 md:hidden">
      <Container>
        <SectionHeader index="02" label={timeline.label} heading={timeline.heading} intro={timeline.intro} />

        <div className="mt-14">
          <Label className="mb-6 pl-8">{timeline.eras["pre-ai"]}</Label>
          <ol className="m-0 list-none border-l border-ink p-0">
            {before.map((stop) => (
              <VerticalStop key={`${stop.year}-${stop.company}`} stop={stop} />
            ))}
          </ol>

          <Reveal className="relative my-10">
            <div aria-hidden className="h-0.5 w-full bg-signal" />
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-signal-ink">
              {timeline.marker.date}
            </p>
            <p className="mt-1.5 font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] text-signal">
              {timeline.marker.label}
            </p>
            <p className="mt-2 max-w-[30ch] text-sm leading-[1.5] text-ink-soft">{timeline.marker.note}</p>
          </Reveal>

          <Label className="mb-6 pl-8 text-signal-ink">{timeline.eras.ai}</Label>
          <ol className="m-0 list-none border-l border-signal p-0">
            {after.map((stop) => (
              <VerticalStop key={`${stop.year}-${stop.company}`} stop={stop} />
            ))}
          </ol>
        </div>
      </Container>
    </div>
  );
}
