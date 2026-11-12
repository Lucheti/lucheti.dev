import type { ChapterId, ChapterPosition } from "./ChapterPosition";
import type { Progress } from "./Progress";
import type { Signal, Unsubscribe } from "./Signal";

/**
 * The reader's progress through one chapter, derived from the story's chapter
 * position. Subscribers hear only about changes to this chapter, not about
 * scrolling elsewhere on the page.
 */
export class ChapterProgress implements Signal<Progress> {
  public constructor(
    private readonly chapters: Signal<ChapterPosition>,
    private readonly id: ChapterId,
  ) {}

  public current(): Progress {
    return this.chapters.current().through(this.id);
  }

  public subscribe(listener: (value: Progress) => void): Unsubscribe {
    let last = this.current();
    return this.chapters.subscribe((position) => {
      const next = position.through(this.id);
      if (!next.equals(last)) {
        last = next;
        listener(next);
      }
    });
  }
}
