import type { TimelineStop } from "@/content";

const SIDE_PROJECT_TAG = "Side project";

/** The tag for a project stop, or null when the role already says it. */
export function sideProjectTag(stop: TimelineStop): string | null {
  if (stop.kind !== "project") {
    return null;
  }
  return stop.role.toLowerCase().includes(SIDE_PROJECT_TAG.toLowerCase()) ? null : SIDE_PROJECT_TAG;
}
