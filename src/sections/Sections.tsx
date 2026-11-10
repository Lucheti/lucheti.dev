import type { ReactNode } from "react";
import type { SiteContent } from "@/content";

type SectionsProps = Readonly<{
  content: SiteContent;
}>;

/** Placeholder until work package C lands. */
export function Sections({ content }: SectionsProps): ReactNode {
  return <main className="p-8 font-mono text-sm text-bone-dim">{content.name}</main>;
}
