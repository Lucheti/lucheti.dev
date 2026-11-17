import type { ReactNode } from "react";
import type { Contact } from "@/content";
import { Chapter } from "@/story";
import { ButtonLink, Container, Label, Reveal } from "@/ui";
import { CopyEmail } from "./CopyEmail";
import { LiveClock } from "./LiveClock";

type ContactSectionProps = Readonly<{
  contact: Contact;
  timeZone: string;
  city: string;
}>;

const CHAPTER_NUMBER = "06";

const RAIL_TEXT = "font-label font-medium text-[11px] uppercase tracking-[0.14em] text-mute";

/** Splits a heading so its last word can take the accent. */
function splitLastWord(heading: string): Readonly<{ lead: string; last: string }> {
  const cut = heading.lastIndexOf(" ");
  if (cut === -1) {
    return { lead: "", last: heading };
  }
  return { lead: heading.slice(0, cut + 1), last: heading.slice(cut + 1) };
}

/** Chapter 06: one line, one button, sign-off. The right 40% stays clear for the artifact. */
export function ContactSection({ contact, timeZone, city }: ContactSectionProps): ReactNode {
  const { lead, last } = splitLastWord(contact.heading);
  const [firstLink, ...otherLinks] = contact.links;

  return (
    <Chapter id="contact" className="relative flex min-h-[80dvh] flex-col bg-paper bg-grid">
      <Container className="flex flex-1 flex-col justify-center gap-10 py-28 lg:py-32">
        <div className="flex flex-col gap-8 lg:max-w-[60%]">
          <Reveal>
            <Label marked>{`${CHAPTER_NUMBER} — ${contact.label}`}</Label>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="text-balance font-display text-[clamp(3rem,8vw,8rem)] font-bold leading-[0.92] tracking-[-0.05em] text-ink">
              {lead}
              <span className="text-signal">{last}</span>
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="max-w-[28rem] text-base leading-[1.6] text-ink-soft md:text-lg">{contact.body}</p>
          </Reveal>
          <Reveal delay={0.24} className="flex flex-wrap gap-3">
            {firstLink && <ButtonLink href={firstLink.href}>{firstLink.label}</ButtonLink>}
            {otherLinks.map((link) => (
              <ButtonLink key={link.href} href={link.href} variant="secondary">
                {link.label}
              </ButtonLink>
            ))}
          </Reveal>
          <Reveal delay={0.32}>
            <CopyEmail email={contact.email} />
          </Reveal>
        </div>
      </Container>

      <div className="border-t border-line">
        <Container className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2 py-5">
          <p className={RAIL_TEXT}>{contact.signoff}</p>
          <LiveClock timeZone={timeZone} city={city} className={RAIL_TEXT} />
          <p className={RAIL_TEXT}>{contact.footnote}</p>
        </Container>
      </div>
    </Chapter>
  );
}
