import type { ReactNode } from "react";
import { AiChapter, CapabilitiesChapter } from "@/capabilities";
import { CraftChapter } from "@/craft";
import { ORCHESTRA_SEQUENCE, type SiteContent } from "@/content";
import { OrchestraChapter } from "@/orchestra";
import { SystemsChapter } from "@/systems";
import { TimelineChapter } from "@/timeline";
import { MotionRoot } from "@/ui";
import { ContactSection } from "./ContactSection";
import { HeroSection } from "./HeroSection";
import { Nav } from "./Nav";

type SectionsProps = Readonly<{
  content: SiteContent;
}>;

const SKIP_LINK_LABEL = "Skip to content";

/** Every chapter of the page, in story order. */
export function Sections({ content }: SectionsProps): ReactNode {
  return (
    <MotionRoot>
      <a
        href="#main"
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-[4px] bg-signal px-4 py-2 font-label font-medium text-xs uppercase tracking-[0.14em] text-ink focus:translate-y-0"
      >
        {SKIP_LINK_LABEL}
      </a>
      <Nav name={content.name} items={content.nav} timeZone={content.timeZone} city={content.city} />
      <main id="main" className="relative z-20">
        <HeroSection hero={content.hero} timeZone={content.timeZone} city={content.city} />
        <TimelineChapter timeline={content.timeline} />
        <CapabilitiesChapter
          capabilities={content.capabilities}
          craft={content.craft}
          systems={content.systems}
          ai={content.ai}
        />
        <CraftChapter craft={content.craft} capabilities={content.capabilities} />
        <SystemsChapter systems={content.systems} capabilities={content.capabilities} />
        <AiChapter ai={content.ai} capabilities={content.capabilities} />
        <OrchestraChapter orchestra={content.orchestra} sequence={ORCHESTRA_SEQUENCE} />
        <ContactSection contact={content.contact} timeZone={content.timeZone} city={content.city} />
      </main>
    </MotionRoot>
  );
}
