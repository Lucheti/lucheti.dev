import type { ReactNode } from "react";
import type { Method } from "@/content";
import { Chapter } from "@/story";
import { Chip, Container, LeftColumn, Reveal, SectionHeader } from "@/ui";
import { MethodRail } from "./MethodRail";

export function MethodSection({ method }: { readonly method: Method }): ReactNode {
  return (
    <Chapter id="method" className="py-28 lg:py-44">
      <Container>
        <LeftColumn className="flex flex-col gap-16 lg:gap-24">
          <SectionHeader label={method.label} heading={method.heading} intro={method.intro} />
          <MethodRail>
            {method.steps.map((step) => (
              <li key={step.number}>
                <Reveal className="grid gap-4 md:grid-cols-[5rem_1fr] md:gap-8">
                  <span aria-hidden className="font-mono text-4xl leading-none text-bone-faint md:text-5xl">
                    {step.number}
                  </span>
                  <div className="flex flex-col gap-4">
                    <h3 className="font-display text-3xl font-semibold leading-none tracking-[-0.03em] text-bone md:text-4xl">
                      {step.title}
                    </h3>
                    <p className="text-xl leading-[1.4] text-bone">{step.claim}</p>
                    <p className="max-w-[34rem] leading-[1.6] text-bone-dim">{step.proof}</p>
                    <div>
                      <Chip>{step.source}</Chip>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </MethodRail>
        </LeftColumn>
      </Container>
    </Chapter>
  );
}
