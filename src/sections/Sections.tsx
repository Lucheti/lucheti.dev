import type { ReactNode } from "react";
import type { SiteContent } from "@/content";
import { MotionRoot } from "@/ui";
import { ContactSection } from "./ContactSection";
import { HeroSection } from "./HeroSection";
import { LabSection } from "./LabSection";
import { MethodSection } from "./MethodSection";
import { Nav } from "./Nav";
import { WorkSection } from "./WorkSection";

type SectionsProps = Readonly<{
  content: SiteContent;
}>;

const SKIP_LINK_LABEL = "Skip to content";

export function Sections({ content }: SectionsProps): ReactNode {
  return (
    <MotionRoot>
      <a
        href="#main"
        className="fixed left-4 top-4 z-40 -translate-y-24 rounded-full bg-lime px-5 py-2 text-sm font-medium text-ink focus:translate-y-0"
      >
        {SKIP_LINK_LABEL}
      </a>
      <Nav name={content.name} items={content.nav} />
      <main id="main" className="relative z-20">
        <HeroSection hero={content.hero} />
        <MethodSection method={content.method} />
        <WorkSection work={content.work} />
        <LabSection lab={content.lab} />
        <ContactSection contact={content.contact} />
      </main>
    </MotionRoot>
  );
}
