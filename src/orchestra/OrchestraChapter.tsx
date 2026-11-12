import type { ReactNode } from "react";
import type { FrameSequence, Orchestra } from "@/content";
import { Chapter } from "@/story";
import { OrchestraStage } from "./OrchestraStage";

type OrchestraChapterProps = Readonly<{
  orchestra: Orchestra;
  sequence: FrameSequence;
}>;

/** Must match the `h-[320dvh]` class below; Tailwind needs the literal. */
const CHAPTER_DVH = 320;

/** The dark finale: a tall chapter whose one-viewport frame stays pinned while scroll plays the pipeline. */
export function OrchestraChapter({ orchestra, sequence }: OrchestraChapterProps): ReactNode {
  return (
    <Chapter id="orchestra" className="relative h-[320dvh] bg-graphite text-fog">
      <OrchestraStage orchestra={orchestra} sequence={sequence} chapterDvh={CHAPTER_DVH} />
    </Chapter>
  );
}
