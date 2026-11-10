import type { ReactNode } from "react";
import { Label } from "./Label";
import { Reveal } from "./Reveal";

type SectionHeaderProps = Readonly<{
  label: string;
  heading: string;
  intro: string;
}>;

/** Label, h2 and intro paragraph shared by method, work and lab. */
export function SectionHeader({ label, heading, intro }: SectionHeaderProps): ReactNode {
  return (
    <header className="flex flex-col gap-6">
      <Reveal>
        <Label marked>{label}</Label>
      </Reveal>
      <Reveal delay={0.08}>
        <h2 className="font-display text-[clamp(2.5rem,5.5vw,5rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-bone">
          {heading}
        </h2>
      </Reveal>
      <Reveal delay={0.16}>
        <p className="max-w-[34rem] text-lg leading-[1.6] text-bone-dim">{intro}</p>
      </Reveal>
    </header>
  );
}
