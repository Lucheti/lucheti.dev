"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { useStory } from "@/story";

// WebGL has no server render; the scene is fetched only in the browser.
const ArtifactScene = dynamic(() => import("./ArtifactScene"), { ssr: false });

/**
 * Fixed, transparent WebGL layer above the chapters (so it also shows over
 * the dark Agents chapter). It never takes pointer events, and its pose table
 * keeps it clear of text.
 */
export function ArtifactStage(): ReactNode {
  const story = useStory();
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-30">
      <ArtifactScene story={story} reducedMotion={reducedMotion} />
    </div>
  );
}
