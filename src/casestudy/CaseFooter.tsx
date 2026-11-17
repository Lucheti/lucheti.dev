import Link from "next/link";
import type { ReactNode } from "react";
import type { Contact, OrchestraPage } from "@/content";
import { LiveClock } from "@/sections";
import { Container } from "@/ui";

type CaseFooterProps = Readonly<{
  contact: Contact;
  timeZone: string;
  city: string;
  footer: OrchestraPage["footer"];
}>;

const RAIL_TEXT = "font-label text-[11px] font-medium uppercase tracking-[0.14em] text-mute";

/** The same bottom line as the main page's contact section, plus a way back. */
export function CaseFooter({ contact, timeZone, city, footer }: CaseFooterProps): ReactNode {
  return (
    <footer className="border-t border-line bg-paper">
      <Container className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2 py-5">
        <p className={RAIL_TEXT}>{contact.signoff}</p>
        <LiveClock timeZone={timeZone} city={city} className={RAIL_TEXT} />
        <p className={RAIL_TEXT}>{contact.footnote}</p>
        <Link href={footer.back.href} className={`transition-colors duration-300 hover:text-ink ${RAIL_TEXT}`}>
          <span aria-hidden>← </span>
          {footer.back.label}
        </Link>
      </Container>
    </footer>
  );
}
