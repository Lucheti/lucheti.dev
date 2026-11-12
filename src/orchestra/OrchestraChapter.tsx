import type { ReactNode } from "react";
import type { FrameSequence, Orchestra } from "@/content";
import { Chapter } from "@/story";

type OrchestraChapterProps = Readonly<{
  orchestra: Orchestra;
  sequence: FrameSequence;
}>;

/** Placeholder until WP-O lands. */
export function OrchestraChapter({ orchestra }: OrchestraChapterProps): ReactNode {
  return (
    <Chapter id="orchestra" className="min-h-dvh bg-graphite p-16 text-fog">
      <h2 className="font-display text-5xl font-semibold">{orchestra.heading}</h2>
    </Chapter>
  );
}
