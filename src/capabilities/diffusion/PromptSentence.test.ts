import { describe, expect, it } from "vitest";
import type { DiffusionPanel } from "@/content";
import { PromptSentence } from "./PromptSentence";

const groups: DiffusionPanel["groups"] = {
  subject: {
    label: "Subject",
    options: [
      { id: "lighthouse", label: "lighthouse", phrase: "lighthouse" },
      { id: "vase", label: "ceramic vase", phrase: "ceramic vase" },
    ],
  },
  mood: {
    label: "Mood",
    options: [
      { id: "dusk", label: "dusk", phrase: "at dusk" },
      { id: "storm", label: "storm", phrase: "in a storm" },
    ],
  },
  framing: {
    label: "Framing",
    options: [
      { id: "wide", label: "wide", phrase: "wide" },
      { id: "close-up", label: "close-up", phrase: "close-up" },
    ],
  },
};

describe("PromptSentence", () => {
  it("reads the chips as a sentence", () => {
    expect(PromptSentence.plain({ subject: "lighthouse", mood: "dusk", framing: "wide" }, groups)).toBe("a lighthouse at dusk, wide shot");
    expect(PromptSentence.plain({ subject: "vase", mood: "storm", framing: "close-up" }, groups)).toBe(
      "a ceramic vase in a storm, close-up shot",
    );
  });

  it("marks exactly the three chosen words", () => {
    const parts = PromptSentence.parts({ subject: "vase", mood: "dusk", framing: "wide" }, groups);
    expect(parts.filter((part) => part.chosen).map((part) => part.text)).toEqual(["ceramic vase", "at dusk", "wide"]);
  });

  it("fails loudly on a chip the content does not know", () => {
    expect(() => PromptSentence.plain({ subject: "city", mood: "dusk", framing: "wide" }, groups)).toThrow();
  });
});
