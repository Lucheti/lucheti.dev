import type { Domain } from "@/content";
import type { ChapterId } from "@/story";

/** A domain chapter the landmark links to. */
export type CapabilitySource = Readonly<{ chapter: ChapterId; domain: Domain }>;

/** One card of the landmark's index. */
export type CapabilityRow = Readonly<{
  name: string;
  chapter: ChapterId;
  /** The first tools of the domain, for a quick scan. */
  preview: readonly string[];
}>;

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

/** Builds the landmark's cards from the domain content, so names and tools are never typed twice. */
export function buildCapabilityIndex(sources: readonly CapabilitySource[]): readonly CapabilityRow[] {
  return sources.map(({ chapter, domain }) => ({
    name: domain.heading,
    chapter,
    preview: previewOf(domain),
  }));
}
