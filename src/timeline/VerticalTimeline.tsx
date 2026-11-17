import type { ReactNode } from "react";
import type { Timeline, TimelineMilestone, TimelineStop } from "@/content";
import { Container, cx, Label, Reveal, SectionHeader } from "@/ui";
import { splitByEra, timelineEntries, type TimelineEntry } from "./TimelineEntries";

const INDUSTRY_PREFIX = "The industry:";

function VerticalStop({ stop }: { readonly stop: TimelineStop }): ReactNode {
  const isAi = stop.era === "ai";

  return (
    <li className="relative pb-12 pl-8 last:pb-0">
      <span
        aria-hidden
        className={cx(
          "absolute -left-[5.5px] top-3 size-2.5 border",
          isAi ? "border-signal bg-signal" : "border-ink bg-paper",
        )}
      />
      <Reveal>
        <p aria-hidden className="font-dot text-[40px] font-semibold leading-none text-mute">
          {stop.year}
        </p>
        <h3 className="mt-3 font-display text-2xl font-semibold leading-[1.05] tracking-[-0.03em] text-ink">
          {stop.company}
        </h3>
        <p className="mt-2.5 flex items-center gap-2.5 font-display text-xl font-semibold leading-[1.1] tracking-[-0.02em] text-signal-ink">
          <span aria-hidden className="size-2 shrink-0 bg-signal" />
          {stop.role}
        </p>
        <p className="mt-2 font-label font-medium text-[11px] uppercase tracking-[0.14em] text-mute">{stop.period}</p>
        <p className="mt-3 max-w-[32ch] text-base leading-[1.5] text-ink">{stop.did}</p>
        <p className="mt-3 max-w-[34ch] text-sm leading-[1.5] text-ink-soft">
          <span className="font-label font-medium text-[11px] uppercase tracking-[0.14em] text-mute">{INDUSTRY_PREFIX}</span>{" "}
          {stop.trend}
        </p>
      </Reveal>
    </li>
  );
}

type VerticalMilestoneProps = Readonly<{
  milestone: TimelineMilestone;
  /** The milestone's kind, already resolved to its display name. */
  kindLabel: string;
}>;

function VerticalMilestone({ milestone, kindLabel }: VerticalMilestoneProps): ReactNode {
  return (
    <li className="relative pb-12 pl-8 last:pb-0">
      <span aria-hidden className="absolute -left-[5.5px] top-1 size-2.5 rotate-45 bg-signal" />
      <Reveal>
        <div aria-hidden className="h-0.5 w-12 bg-signal" />
        <p className="mt-3 font-label font-medium text-[11px] uppercase tracking-[0.16em] text-signal-ink">
          {kindLabel} · {milestone.date}
        </p>
        <p className="mt-1.5 font-display text-2xl font-semibold leading-[1.05] tracking-[-0.03em] text-signal">
          {milestone.label}
        </p>
        <p className="mt-2 max-w-[30ch] text-sm leading-[1.5] text-ink-soft">{milestone.note}</p>
      </Reveal>
    </li>
  );
}

function assertNever(value: never): never {
  throw new Error(`Unhandled timeline entry: ${String(value)}`);
}

function entryKey(entry: TimelineEntry): string {
  switch (entry.kind) {
    case "stop":
      return `${entry.stop.year}-${entry.stop.company}`;
    case "milestone":
      return `${entry.milestone.date}${entry.milestone.label}`;
    default:
      return assertNever(entry);
  }
}

function renderEntry(entry: TimelineEntry, kinds: Timeline["milestoneKinds"]): ReactNode {
  switch (entry.kind) {
    case "stop":
      return <VerticalStop key={entryKey(entry)} stop={entry.stop} />;
    case "milestone":
      return (
        <VerticalMilestone
          key={entryKey(entry)}
          milestone={entry.milestone}
          kindLabel={kinds[entry.milestone.kind]}
        />
      );
    default:
      return assertNever(entry);
  }
}

/** The phone layout: no pin, a vertical axis with each milestone as a short horizontal orange rule. */
export function VerticalTimeline({ timeline }: { readonly timeline: Timeline }): ReactNode {
  const { before, after } = splitByEra(timelineEntries(timeline.stops, timeline.milestones));

  return (
    <div className="bg-paper py-24 md:hidden">
      <Container>
        <SectionHeader label={timeline.label} heading={timeline.heading} intro={timeline.intro} />

        <div className="mt-14">
          <Label className="mb-6 pl-8">{timeline.eras["pre-ai"]}</Label>
          <ol className="m-0 list-none border-l border-ink p-0">
            {before.map((entry) => renderEntry(entry, timeline.milestoneKinds))}
          </ol>

          <Label className="mb-6 mt-10 pl-8 text-signal-ink">{timeline.eras.ai}</Label>
          <ol className="m-0 list-none border-l border-signal p-0">
            {after.map((entry) => renderEntry(entry, timeline.milestoneKinds))}
          </ol>
        </div>
      </Container>
    </div>
  );
}
