import type { ReactNode } from "react";
import type { Systems } from "@/content";
import { Chapter } from "@/story";

/** Placeholder until WP-S lands. */
export function SystemsChapter({ systems }: { readonly systems: Systems }): ReactNode {
  return (
    <Chapter id="systems" className="min-h-dvh p-16">
      <h2 className="font-display text-5xl font-semibold">{systems.heading}</h2>
    </Chapter>
  );
}
