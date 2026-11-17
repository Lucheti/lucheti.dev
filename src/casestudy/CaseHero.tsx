import type { ReactNode } from "react";
import type { OrchestraPage } from "@/content";
import { Container, Label, Reveal } from "@/ui";

type CaseHeroProps = Readonly<{ hero: OrchestraPage["hero"] }>;

/** The case study's opening: label, the name at display size, one lede and a row of facts. */
export function CaseHero({ hero }: CaseHeroProps): ReactNode {
  return (
    <header className="bg-paper bg-grid pb-24 pt-40">
      <Container className="flex flex-col gap-8">
        <Reveal trigger="mount">
          <Label marked>{hero.label}</Label>
        </Reveal>
        <Reveal trigger="mount" delay={0.08}>
          <h1 className="font-display text-[clamp(4rem,12vw,10rem)] font-bold leading-[0.9] tracking-[-0.05em] text-ink">
            {hero.heading}
          </h1>
        </Reveal>
        <Reveal trigger="mount" delay={0.16}>
          <p className="max-w-[40rem] text-lg leading-[1.55] text-ink-soft md:text-xl">{hero.lede}</p>
        </Reveal>
        <Reveal trigger="mount" delay={0.24}>
          <ul className="flex flex-wrap gap-x-8 gap-y-2 border-t border-line pt-6">
            {hero.facts.map((fact) => (
              <li key={fact} className="font-label text-[11px] font-medium uppercase tracking-[0.14em] text-ink">
                {fact}
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </header>
  );
}
