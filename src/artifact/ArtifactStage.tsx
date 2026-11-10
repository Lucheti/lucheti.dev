"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { useStory } from "@/story";

// WebGL has no server render; the scene is fetched only in the browser.
const ArtifactScene = dynamic(() => import("./ArtifactScene"), { ssr: false });

/** Fixed, transparent WebGL layer between the backdrop and the sections. */
export function ArtifactStage(): ReactNode {
  const story = useStory();
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-10 opacity-40 lg:opacity-100">
      <ArtifactScene story={story} reducedMotion={reducedMotion} />
    </div>
  );
}
