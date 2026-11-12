import type { ReactNode } from "react";
import type { Hero } from "@/content";
import { Chapter } from "@/story";

type HeroSectionProps = Readonly<{
  hero: Hero;
  timeZone: string;
  city: string;
}>;

/** Placeholder until WP-H lands. */
export function HeroSection({ hero }: HeroSectionProps): ReactNode {
  return (
    <Chapter id="hero" className="min-h-dvh p-16">
      <h1 className="font-display text-7xl font-semibold">{hero.name.join(" ")}</h1>
    </Chapter>
  );
}
