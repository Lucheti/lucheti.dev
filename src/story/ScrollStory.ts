import { CHAPTER_IDS, ChapterPosition, type ChapterId } from "./ChapterPosition";
import { Progress } from "./Progress";
import { Emitter, type Signal, type Unsubscribe } from "./Signal";
import type { Story } from "./Story";
import type { ChapterAnchor, Viewport } from "./Viewport";

/**
 * Derives the story from a scrolling viewport and the chapter anchors that
 * register with it.
 */
export class ScrollStory implements Story {
  private readonly pageSignal: Emitter<Progress> = new Emitter(Progress.START, (a, b) =>
    a.equals(b),
  );
  private readonly chapterSignal: Emitter<ChapterPosition> = new Emitter(
    ChapterPosition.FIRST,
    (a, b) => a.equals(b),
  );
  private readonly anchors: Map<ChapterId, ChapterAnchor> = new Map();

  public constructor(private readonly viewport: Viewport) {}

  public page(): Signal<Progress> {
    return this.pageSignal;
  }

  public chapters(): Signal<ChapterPosition> {
    return this.chapterSignal;
  }

  /** Begins following the viewport. Call the returned function to stop. */
  public follow(): Unsubscribe {
    const stop = this.viewport.onChange(() => this.measure());
    this.measure();
    return stop;
  }

  /** Marks where a chapter begins. Call the returned function to remove it. */
  public anchor(id: ChapterId, anchor: ChapterAnchor): Unsubscribe {
    this.anchors.set(id, anchor);
    this.measure();
    return () => {
      if (this.anchors.get(id) === anchor) {
        this.anchors.delete(id);
      }
    };
  }

  private measure(): void {
    const distance = this.viewport.scrollableDistance();
    const scrollTop = this.viewport.scrollTop();
    this.pageSignal.emit(distance > 0 ? Progress.of(scrollTop / distance) : Progress.START);
    this.chapterSignal.emit(this.locate(scrollTop, distance));
  }

  /**
   * A chapter is "reached" when its top meets the top of the viewport. Tops
   * are capped at the scrollable distance so that the final chapter is reached
   * at the end of the page even when it is shorter than the screen.
   */
  private locate(scrollTop: number, distance: number): ChapterPosition {
    if (distance <= 0) {
      // Nothing to scroll (or layout not measured yet): the story has not begun.
      return ChapterPosition.FIRST;
    }
    const tops = CHAPTER_IDS.map((id) => {
      const anchor = this.anchors.get(id);
      return anchor ? Math.min(anchor.top(), distance) : Number.POSITIVE_INFINITY;
    });
    let index = 0;
    for (let i = 0; i < tops.length; i += 1) {
      if (scrollTop >= tops[i]) {
        index = i;
      }
    }
    const from = tops[index];
    const to = tops[index + 1];
    if (!Number.isFinite(from) || to === undefined || !Number.isFinite(to) || to <= from) {
      return ChapterPosition.at(index);
    }
    return ChapterPosition.at(index + Progress.of((scrollTop - from) / (to - from)).toNumber());
  }
}
