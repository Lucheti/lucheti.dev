import Link from "next/link";
import type { ReactNode } from "react";
import type { OrchestraPage } from "@/content";
import { Container, initialsOf } from "@/ui";

type CaseStudyBarProps = Readonly<{ bar: OrchestraPage["bar"] }>;

const BAR_TEXT = "font-label text-[11px] font-medium uppercase tracking-[0.14em]";

/** The fixed top bar of the case study: home on the left, back to the AI chapter on the right. */
export function CaseStudyBar({ bar }: CaseStudyBarProps): ReactNode {
  return (
    <header className="fixed inset-x-0 top-0 z-40 h-14 border-b border-line bg-paper/80 backdrop-blur-md">
      <Container className="flex h-full items-center justify-between gap-6">
        <Link href={bar.home.href} aria-label={bar.home.label} className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-7 items-center justify-center rounded-[3px] bg-ink font-label text-[11px] font-medium tracking-[0.04em] text-paper"
          >
            {initialsOf(bar.home.label)}
          </span>
          <span className={`hidden text-ink md:inline ${BAR_TEXT}`}>{bar.home.label}</span>
        </Link>
        <Link href={bar.back.href} className={`group flex items-center gap-2 text-mute transition-colors duration-300 hover:text-ink ${BAR_TEXT}`}>
          <span aria-hidden className="transition-transform duration-300 group-hover:-translate-x-1">
            ←
          </span>
          {bar.back.label}
        </Link>
      </Container>
    </header>
  );
}
