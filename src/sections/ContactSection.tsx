import type { ReactNode } from "react";
import type { Contact } from "@/content";
import { Chapter } from "@/story";
import { ButtonLink, Container, Label, LeftColumn, Reveal } from "@/ui";

/**
 * The closing chapter. It keeps the left column like the rest of the page so
 * the finished artifact can come to rest on the backdrop's bright core.
 */
export function ContactSection({ contact }: { readonly contact: Contact }): ReactNode {
  return (
    <Chapter id="contact" className="flex min-h-dvh flex-col pt-28 lg:pt-44">
      <Container className="flex flex-1 flex-col justify-between gap-16 pb-8 lg:pb-10">
        <LeftColumn className="flex flex-1 flex-col justify-end gap-8 pt-[34dvh] lg:justify-center lg:pt-0">
          <Reveal>
            <Label marked>{contact.label}</Label>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="max-w-[14ch] text-balance font-display text-[clamp(2.75rem,6.4vw,6rem)] font-semibold leading-[0.95] tracking-[-0.045em] text-bone">
              {contact.heading}
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="max-w-[34rem] text-lg leading-[1.6] text-bone-dim">{contact.body}</p>
          </Reveal>
          <Reveal delay={0.24} className="flex flex-wrap gap-3">
            {contact.links.map((link, index) => (
              <ButtonLink key={link.href} href={link.href} variant={index === 0 ? "primary" : "secondary"}>
                {link.label}
              </ButtonLink>
            ))}
          </Reveal>
        </LeftColumn>
        <footer className="w-full border-t border-line pt-6">
          <p className="font-mono text-xs tracking-[0.04em] text-bone-faint">{contact.footnote}</p>
        </footer>
      </Container>
    </Chapter>
  );
}
