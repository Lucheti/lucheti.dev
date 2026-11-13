import type { Era, TimelineMilestone, TimelineStop } from "@/content";

export type TimelineEntry =
  | Readonly<{ kind: "stop"; era: Era; stop: TimelineStop }>
  | Readonly<{ kind: "milestone"; era: Era; milestone: TimelineMilestone }>;

export type EraSplit = Readonly<{
  before: readonly TimelineEntry[];
  after: readonly TimelineEntry[];
}>;

/** The stops in order, each milestone right after stop `afterStop`, in the era of the stop that follows it. */
export function timelineEntries(
  stops: readonly TimelineStop[],
  milestones: readonly TimelineMilestone[],
): readonly TimelineEntry[] {
  for (const milestone of milestones) {
    if (!Number.isInteger(milestone.afterStop) || milestone.afterStop < 0 || milestone.afterStop > stops.length - 2) {
      throw new RangeError(`milestone "${milestone.label}" must sit between two stops`);
    }
  }
  return stops.flatMap((stop, index): TimelineEntry[] => {
    const next = stops[index + 1];
    const here = milestones
      .filter((milestone) => milestone.afterStop === index)
      .map((milestone): TimelineEntry => ({ kind: "milestone", era: (next ?? stop).era, milestone }));
    return [{ kind: "stop", era: stop.era, stop }, ...here];
  });
}

/** Separates the entries of the first era from the ones after the era turns. */
export function splitByEra(entries: readonly TimelineEntry[]): EraSplit {
  return {
    before: entries.filter((entry) => entry.era === "pre-ai"),
    after: entries.filter((entry) => entry.era === "ai"),
  };
}
