import type { ReactNode } from "react";
import type { Timeline } from "@/content";
import { Chapter } from "@/story";

/** Placeholder until WP-T lands. */
export function TimelineChapter({ timeline }: { readonly timeline: Timeline }): ReactNode {
  return (
    <Chapter id="timeline" className="min-h-dvh p-16">
      <h2 className="font-display text-5xl font-semibold">{timeline.heading}</h2>
    </Chapter>
  );
}
