"use client";

import dynamic from "next/dynamic";
import { useInView, useReducedMotion } from "motion/react";
import { useRef, type ReactNode } from "react";
import { cx, SceneBoundary } from "@/ui";

// WebGL has no server render; the scene is fetched only in the browser.
const ArtifactScene = dynamic(() => import("./ArtifactScene"), { ssr: false });

/**
 * The 3D object beside the contact line: a fixed square box in the section, so it scrolls with the page
 * like any other element. It turns slowly and leans toward the pointer, draws only while on screen, and
 * takes no pointer events. Decorative: without WebGL it simply isn't drawn.
 */
export function ContactArtifact({ className }: Readonly<{ className?: string }>): ReactNode {
  const boxRef = useRef<HTMLDivElement>(null);
  const running = useInView(boxRef, { margin: "10% 0px 10% 0px" });
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <div ref={boxRef} aria-hidden="true" className={cx("pointer-events-none relative aspect-square", className)}>
      <div className="absolute inset-0">
        <SceneBoundary>
          <ArtifactScene reducedMotion={reducedMotion} running={running} />
        </SceneBoundary>
      </div>
    </div>
  );
}
