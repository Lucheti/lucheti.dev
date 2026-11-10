import type { ReactNode } from "react";
import type { Hero } from "@/content";
import { Chapter } from "@/story";
import { ButtonLink, Container, Label, LeftColumn, Reveal } from "@/ui";
import { HeroHeadline } from "./HeroHeadline";

const SCROLL_CUE = "Scroll";

export function HeroSection({ hero }: { readonly hero: Hero }): ReactNode {
  return (
    <Chapter id="hero" className="flex min-h-dvh flex-col">
      <Container className="flex flex-1 flex-col pb-8 pt-32 lg:pb-10">
        <LeftColumn className="flex flex-1 flex-col justify-center gap-8 py-10 lg:gap-10">
          <Reveal trigger="mount" delay={0.05}>
            <Label marked>{hero.eyebrow}</Label>
          </Reveal>
          <HeroHeadline lines={hero.headline} />
          <Reveal trigger="mount" delay={0.45}>
            <p className="max-w-[34rem] text-base leading-[1.6] text-bone-dim md:text-lg">{hero.lede}</p>
          </Reveal>
          <Reveal trigger="mount" delay={0.55} className="flex flex-wrap gap-3">
            <ButtonLink href={hero.primary.href}>{hero.primary.label}</ButtonLink>
            <ButtonLink href={hero.secondary.href} variant="secondary">
              {hero.secondary.label}
            </ButtonLink>
          </Reveal>
        </LeftColumn>

        <Reveal trigger="mount" delay={0.75}>
          <div className="flex items-end justify-between gap-8 border-t border-line pt-6">
            <dl className="grid flex-1 grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-8 lg:max-w-[56%]">
              {hero.facts.map((fact) => (
                <div key={fact.label} className="flex flex-col gap-2">
                  <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-bone-faint">{fact.label}</dt>
                  <dd className="text-sm leading-[1.5] text-bone-dim">{fact.value}</dd>
                </div>
              ))}
            </dl>
            <p
              aria-hidden
              className="hidden items-center gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-bone-dim md:flex"
            >
              {SCROLL_CUE}
              <span className="h-px w-10 bg-lime" />
            </p>
          </div>
        </Reveal>
      </Container>
    </Chapter>
  );
}
