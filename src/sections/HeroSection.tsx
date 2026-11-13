import type { ReactNode } from "react";
import type { Hero } from "@/content";
import { Chapter } from "@/story";
import { HeroStage } from "./HeroStage";

type HeroSectionProps = Readonly<{
  hero: Hero;
  timeZone: string;
  city: string;
}>;

/** Chapter 01: name, role and face, composed in layers on a spec sheet. */
export function HeroSection({ hero }: HeroSectionProps): ReactNode {
  return (
    <Chapter id="hero">
      <HeroStage hero={hero} />
    </Chapter>
  );
}
