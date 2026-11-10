import type { ChapterPosition } from "./ChapterPosition";
import type { Progress } from "./Progress";
import type { Signal } from "./Signal";

/**
 * The scroll story every animated layer follows.
 *
 * `page()` runs 0 → 1 over the whole document and drives the backdrop.
 * `chapters()` says which section the reader is in and drives the artifact.
 *
 * Read `current()` inside animation loops (requestAnimationFrame, useFrame);
 * use `subscribe()` when work should only happen on change.
 */
export interface Story {
  page(): Signal<Progress>;
  chapters(): Signal<ChapterPosition>;
}
