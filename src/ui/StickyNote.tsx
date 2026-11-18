import type { ReactNode } from "react";
import type { RepoFeature } from "@/content";
import { ButtonLink } from "./ButtonLink";

/** A thin arrow drawn by hand, curving up from the sticky note into the card above it. */
function NoteArrow(): ReactNode {
  return (
    <svg
      aria-hidden
      viewBox="0 0 80 150"
      fill="none"
      className="pointer-events-none absolute -left-[76px] -top-[100px] h-[150px] w-[80px] text-ink"
    >
      {/*
        The note's left edge is at x 76 and its top at y 100; the card's bottom is about 68 px above the note.
        One bend only: the line leaves the note's left side heading left, then rises straight into the card;
        the head follows its last direction.
      */}
      <path d="M70 142 C 30 142, 22 112, 24 27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17.5 36.5 L 24 25 L 30.8 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * A sticky note under a card, pointing up at it with a hand-drawn arrow: a line about the repository and a
 * button to more about it on this site. Slightly turned, like paper stuck to the page.
 */
export function StickyNote({ feature }: Readonly<{ feature: RepoFeature }>): ReactNode {
  return (
    <div className="relative ml-[22%] mt-14 max-w-[24rem]">
      <NoteArrow />
      <div className="relative -rotate-[1.5deg] rounded-[3px] bg-[#ffe7a1] px-5 pb-5 pt-6 text-ink shadow-[0_1px_1px_rgb(60_40_0/0.08),0_14px_24px_-14px_rgb(60_40_0/0.45)]">
        <span aria-hidden className="absolute -top-2.5 right-8 h-5 w-16 rotate-[3deg] bg-white/55 shadow-[0_1px_2px_rgb(0_0_0/0.08)]" />
        <p className="text-[15px] leading-[1.5]">{feature.note}</p>
        <div className="mt-4">
          <ButtonLink href={feature.href}>{feature.cta}</ButtonLink>
        </div>
      </div>
    </div>
  );
}
