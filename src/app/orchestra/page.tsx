import type { Metadata } from "next";
import { CaseDemo, CaseFooter, CaseHero, CaseSections, CaseStudyBar } from "@/casestudy";
import { ORCHESTRA_PAGE, ORCHESTRA_SEQUENCE, SITE } from "@/content";
import { MotionRoot } from "@/ui";

export const metadata: Metadata = {
  title: ORCHESTRA_PAGE.metadata.title,
  description: ORCHESTRA_PAGE.metadata.description,
};

/**
 * Second composition root: the Orchestra case study. It shares no scroll story
 * with the main page; the pinned board reads its own section's scroll.
 */
export default function OrchestraPage() {
  return (
    <MotionRoot>
      <a
        href="#main"
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-[4px] bg-signal px-4 py-2 font-label text-xs font-medium uppercase tracking-[0.14em] text-ink focus:translate-y-0"
      >
        Skip to content
      </a>
      <CaseStudyBar bar={ORCHESTRA_PAGE.bar} />
      <main id="main">
        <CaseHero hero={ORCHESTRA_PAGE.hero} />
        <CaseDemo demo={ORCHESTRA_PAGE.demo} orchestra={SITE.orchestra} sequence={ORCHESTRA_SEQUENCE} />
        <CaseSections
          sections={ORCHESTRA_PAGE.sections}
          departments={SITE.orchestra.departments}
          builtWith={ORCHESTRA_PAGE.builtWith}
        />
      </main>
      <CaseFooter contact={SITE.contact} timeZone={SITE.timeZone} city={SITE.city} footer={ORCHESTRA_PAGE.footer} />
    </MotionRoot>
  );
}
