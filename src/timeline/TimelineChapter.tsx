import type { ReactNode } from "react";
import type { Timeline } from "@/content";
import { Chapter } from "@/story";
import { PinnedTimeline } from "./PinnedTimeline";
import { VerticalTimeline } from "./VerticalTimeline";

/** 02 — the build log. Both layouts are in the markup; CSS shows the one that fits. */
export function TimelineChapter({ timeline }: { readonly timeline: Timeline }): ReactNode {
  return (
    <Chapter id="timeline" className="bg-paper">
      <VerticalTimeline timeline={timeline} />
      <PinnedTimeline timeline={timeline} />
    </Chapter>
  );
}
