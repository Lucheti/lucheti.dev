import type { DiffusionPanel } from "@/content";
import type { PromptChips } from "./SceneRecipe";

/** A piece of the prompt sentence; the chosen words are the ones a chip supplied. */
export type SentencePart = Readonly<{ text: string; chosen: boolean }>;

type Groups = DiffusionPanel["groups"];

/** Reads the chips as a sentence: "a lighthouse at dusk, wide shot". */
export class PromptSentence {
  /** The sentence in pieces, so the chosen words can be set in bold. */
  public static parts(chips: PromptChips, groups: Groups): readonly SentencePart[] {
    return [
      { text: "a ", chosen: false },
      { text: PromptSentence.phrase(groups.subject.options, chips.subject), chosen: true },
      { text: " ", chosen: false },
      { text: PromptSentence.phrase(groups.mood.options, chips.mood), chosen: true },
      { text: ", ", chosen: false },
      { text: PromptSentence.phrase(groups.framing.options, chips.framing), chosen: true },
      { text: " shot", chosen: false },
    ];
  }

  /** The same sentence as plain text. */
  public static plain(chips: PromptChips, groups: Groups): string {
    return PromptSentence.parts(chips, groups)
      .map((part) => part.text)
      .join("");
  }

  private static phrase<Id extends string>(options: readonly { id: Id; phrase: string }[], id: Id): string {
    const option = options.find((candidate) => candidate.id === id);
    if (option === undefined) {
      throw new Error(`No option "${id}" in the prompt groups`);
    }
    return option.phrase;
  }
}
