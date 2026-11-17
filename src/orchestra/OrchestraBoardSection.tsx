"use client";

import { useState, type ReactNode } from "react";
import type { FrameSequence, Orchestra } from "@/content";
import { ElementScrollProgress, MountedElement, WindowSurface } from "@/story";
import { OrchestraStage } from "./OrchestraStage";

type OrchestraBoardSectionProps = Readonly<{
  orchestra: Orchestra;
  sequence: FrameSequence;
}>;

/** The section's own scroll: a callback ref to attach, and the progress that reads it. */
function trackSection(): Readonly<{ attach: MountedElement["attach"]; progress: ElementScrollProgress }> {
  const element = new MountedElement();
  return { attach: element.attach, progress: new ElementScrollProgress(element, new WindowSurface(() => window)) };
}

/** The pinned board: a tall dark section whose one-viewport frame stays put while scroll plays the pipeline. */
export function OrchestraBoardSection({ orchestra, sequence }: OrchestraBoardSectionProps): ReactNode {
  const [{ attach, progress }] = useState(trackSection);

  return (
    <section ref={attach} id="live-demo" className="relative h-[320dvh] bg-graphite text-fog">
      <OrchestraStage orchestra={orchestra} sequence={sequence} progress={progress} />
    </section>
  );
}
