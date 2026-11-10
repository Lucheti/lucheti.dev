import { Progress } from "./Progress";

/** The chapters of the page, in scroll order. */
export const CHAPTER_IDS = ["hero", "method", "work", "lab", "contact"] as const;

export type ChapterId = (typeof CHAPTER_IDS)[number];

/**
 * Where the reader is in the story: the chapter they are in and how far they
 * have travelled toward the next one.
 *
 * Using chapters rather than raw page progress keeps choreography stable when
 * section heights change: "the pose at `work`" is always the pose at `work`.
 */
export class ChapterPosition {
  public static readonly FIRST: ChapterPosition = new ChapterPosition(0, Progress.START);

  private constructor(
    private readonly index: number,
    private readonly travelled: Progress,
  ) {}

  /**
   * Builds a position from a continuous number, e.g. 1.25 is a quarter of the
   * way from the second chapter to the third. Values are clamped to the story.
   */
  public static at(continuous: number): ChapterPosition {
    if (!Number.isFinite(continuous)) {
      throw new RangeError(`Chapter position must be finite, got ${continuous}`);
    }
    const last = CHAPTER_IDS.length - 1;
    const clamped = Math.min(last, Math.max(0, continuous));
    const index = Math.min(last, Math.floor(clamped));
    const travelled = index === last ? Progress.START : Progress.of(clamped - index);
    return new ChapterPosition(index, travelled);
  }

  /** The chapter the reader is currently in. */
  public chapter(): ChapterId {
    return CHAPTER_IDS[this.index];
  }

  /** The chapter being approached; the last chapter approaches itself. */
  public upcoming(): ChapterId {
    return CHAPTER_IDS[Math.min(CHAPTER_IDS.length - 1, this.index + 1)];
  }

  /** How far the reader has travelled from `chapter()` toward `upcoming()`. */
  public blend(): Progress {
    return this.travelled;
  }

  /** Continuous form: chapter index plus blend. */
  public toNumber(): number {
    return this.index + this.travelled.toNumber();
  }

  public equals(other: ChapterPosition): boolean {
    return this.index === other.index && this.travelled.equals(other.travelled);
  }
}
