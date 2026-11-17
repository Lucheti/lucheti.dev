import type { PromptChips } from "./SceneRecipe";

/** One picture that was asked for: its chips and seed are all it takes to draw it again. */
export type Generation = Readonly<{
  /** Unique within a visit, so a thumbnail keeps its identity as the strip shifts. */
  id: number;
  chips: PromptChips;
  seed: number;
}>;

/** The most recent pictures, newest first, with no two the same (asking again moves one to the front). */
export class GenerationHistory {
  private constructor(
    private readonly limit: number,
    private readonly items: readonly Generation[],
  ) {}

  public static empty(limit: number): GenerationHistory {
    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error(`A history must keep at least one picture, not ${limit}`);
    }
    return new GenerationHistory(limit, []);
  }

  /** A history with `generation` in front; an earlier identical picture is replaced and the oldest drops off. */
  public with(generation: Generation): GenerationHistory {
    const rest = this.items.filter((item) => !GenerationHistory.same(item, generation));
    return new GenerationHistory(this.limit, [generation, ...rest].slice(0, this.limit));
  }

  /** The pictures, newest first. */
  public list(): readonly Generation[] {
    return this.items;
  }

  private static same(a: Generation, b: Generation): boolean {
    return (
      a.seed === b.seed && a.chips.subject === b.chips.subject && a.chips.mood === b.chips.mood && a.chips.framing === b.chips.framing
    );
  }
}
