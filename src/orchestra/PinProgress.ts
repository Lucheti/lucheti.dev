import { Progress } from "@/story";
import type { Signal, Unsubscribe } from "@/story";

const VIEWPORT_DVH = 100;

/**
 * Progress through the part of a chapter during which its sticky frame is
 * actually pinned.
 *
 * A chapter's own progress runs for its full height, but a sticky frame
 * (one viewport tall) lets go once the chapter's bottom reaches the viewport
 * bottom, one viewport earlier. Rescaling makes 0 → 1 mean "pin start → pin end"
 * so scrubbed content finishes while it is still on screen.
 */
export class PinProgress implements Signal<Progress> {
  public constructor(
    private readonly chapter: Signal<Progress>,
    private readonly pinnedShare: number,
  ) {
    if (!(pinnedShare > 0 && pinnedShare <= 1)) {
      throw new RangeError(`The pinned share must be within (0, 1], got ${pinnedShare}`);
    }
  }

  /** For a chapter `chapterDvh` tall holding a one-viewport sticky frame. */
  public static ofStickyFrame(chapter: Signal<Progress>, chapterDvh: number): PinProgress {
    if (!(chapterDvh > VIEWPORT_DVH)) {
      throw new RangeError("A pinned chapter must be taller than the viewport");
    }
    return new PinProgress(chapter, (chapterDvh - VIEWPORT_DVH) / chapterDvh);
  }

  public current(): Progress {
    return this.rescale(this.chapter.current());
  }

  public subscribe(listener: (value: Progress) => void): Unsubscribe {
    let last = this.current();
    return this.chapter.subscribe((value) => {
      const next = this.rescale(value);
      if (!next.equals(last)) {
        last = next;
        listener(next);
      }
    });
  }

  private rescale(value: Progress): Progress {
    return Progress.of(value.toNumber() / this.pinnedShare);
  }
}
