import type { ReactNode } from "react";
import type { Contact } from "@/content";
import { Chapter } from "@/story";
import { ButtonLink, Container, Label, Reveal } from "@/ui";

export function ContactSection({ contact }: { readonly contact: Contact }): ReactNode {
  return (
    <Chapter id="contact" className="flex min-h-dvh flex-col justify-end pt-28 lg:pt-44">
      <Container className="flex flex-col items-center gap-12 pb-8 lg:pb-10">
        <div className="flex flex-col items-center gap-8 pt-[30dvh] text-center lg:pt-[18dvh]">
          <Reveal>
            <Label marked>{contact.label}</Label>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="max-w-[16ch] text-balance font-display text-[clamp(2.75rem,7vw,6.5rem)] font-semibold leading-[0.95] tracking-[-0.045em] text-bone">
              {contact.heading}
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto max-w-[34rem] text-lg leading-[1.6] text-bone-dim">{contact.body}</p>
          </Reveal>
          <Reveal delay={0.24} className="flex flex-wrap justify-center gap-3">
            {contact.links.map((link, index) => (
              <ButtonLink key={link.href} href={link.href} variant={index === 0 ? "primary" : "secondary"}>
                {link.label}
              </ButtonLink>
            ))}
          </Reveal>
        </div>
        <footer className="w-full border-t border-line pt-6 text-center">
          <p className="font-mono text-xs tracking-[0.04em] text-bone-faint">{contact.footnote}</p>
        </footer>
      </Container>
    </Chapter>
  );
}
