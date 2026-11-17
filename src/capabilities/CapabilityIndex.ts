import type { Domain } from "@/content";
import type { ChapterId } from "@/story";

/** A domain chapter the landmark links to. */
export type CapabilitySource = Readonly<{ chapter: ChapterId; domain: Domain }>;

/** One row of the landmark's index. */
export type CapabilityRow = Readonly<{
  /** Chapter number as two digits, e.g. "03". */
  number: string;
  name: string;
  chapter: ChapterId;
  /** The first tools of the domain, for a quick scan. */
  preview: readonly string[];
}>;

/** First chapter number of the domain chapters; the landmark itself is not numbered. */
const FIRST_NUMBER = 3;
const PREVIEW_LENGTH = 6;

/** The first `PREVIEW_LENGTH` unique tools across a domain's areas, in order. */
function previewOf(domain: Domain): readonly string[] {
  const unique = new Set<string>();
  for (const area of domain.areas) {
    for (const tool of area.tools) {
      unique.add(tool);
    }
  }
  return Array.from(unique).slice(0, PREVIEW_LENGTH);
}

/** Builds the landmark's rows from the domain content, so names and tools are never typed twice. */
export function buildCapabilityIndex(sources: readonly CapabilitySource[]): readonly CapabilityRow[] {
  return sources.map(({ chapter, domain }, position) => ({
    number: String(FIRST_NUMBER + position).padStart(2, "0"),
    name: domain.heading,
    chapter,
    preview: previewOf(domain),
  }));
}
