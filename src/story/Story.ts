import type { ChapterId, ChapterPosition } from "./ChapterPosition";
import type { Progress } from "./Progress";
import type { Signal } from "./Signal";

/**
 * The scroll story every animated layer follows.
 *
 * `page()` runs 0 → 1 over the whole document.
 * `chapters()` says which chapter the reader is in; it drives the artifact.
 * `through(id)` runs 0 → 1 while the reader travels through one chapter, from
 * the moment its top meets the top of the viewport until the next chapter's
 * top does. It drives anything scrubbed inside a pinned chapter.
 *
 * Read `current()` inside animation loops (requestAnimationFrame, useFrame);
 * use `subscribe()` when work should only happen on change.
 */
export interface Story {
  page(): Signal<Progress>;
  chapters(): Signal<ChapterPosition>;
  through(id: ChapterId): Signal<Progress>;
}
