import type { ReactNode } from "react";
import type { Craft } from "@/content";
import { Chapter } from "@/story";

/** Placeholder until WP-S lands. */
export function CraftChapter({ craft }: { readonly craft: Craft }): ReactNode {
  return (
    <Chapter id="craft" className="min-h-dvh p-16">
      <h2 className="font-display text-5xl font-semibold">{craft.heading}</h2>
    </Chapter>
  );
}
