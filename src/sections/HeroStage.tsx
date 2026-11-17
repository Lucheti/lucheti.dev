"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";
import type { Hero } from "@/content";
import { ButtonLink, Container, EASE_OUT_EXPO, Reveal } from "@/ui";
import { DepthLayer, usePointerDepth } from "./depth";
import { PortraitFrame } from "./PortraitFrame";

const LETTER_STAGGER_S = 0.04;
const COPY_DELAY_S = 0.9;

/** Pointer travel of the name layer, in px at the screen edge. */
const NAME_POINTER_TRAVEL = 6;

function NameLine({ text, firstIndex }: { readonly text: string; readonly firstIndex: number }): ReactNode {
  return (
    <span className="-my-[0.04em] block overflow-hidden py-[0.04em]">
      {Array.from(text).map((letter, offset) => (
        <motion.span
          key={`${letter}-${firstIndex + offset}`}
          aria-hidden
          className="inline-block"
          initial={{ y: "110%" }}
          animate={{ y: "0%" }}
          transition={{ duration: 0.9, delay: (firstIndex + offset) * LETTER_STAGGER_S, ease: EASE_OUT_EXPO }}
        >
          {letter}
        </motion.span>
      ))}
    </span>
  );
}

/**
 * Sized from its own column (container query width) and from the viewport height, so two lines
 * fit beside the circle at any desktop size; the 6-letter surname is about 3.9em wide.
 */
function HeroName({ name }: { readonly name: Hero["name"] }): ReactNode {
  const [first, last] = name;
  return (
    <div className="@container">
      <h1
        aria-label={name.join(" ")}
        className="font-display text-[length:23cqw] font-bold uppercase leading-[0.82] tracking-[-0.06em] text-ink lg:text-[length:min(23cqw,17.5dvh,21rem)]"
      >
        <NameLine text={first} firstIndex={0} />
        <NameLine text={last} firstIndex={Array.from(first).length} />
      </h1>
    </div>
  );
}

function Facts({ facts }: { readonly facts: Hero["facts"] }): ReactNode {
  return (
    <dl className="grid grid-cols-3 gap-x-4 border-t border-line pt-4">
      {facts.map((fact) => (
        <div key={fact.label} className="flex flex-col gap-1.5">
          <dt className="font-label font-medium text-[11px] uppercase tracking-[0.12em] text-mute">{fact.label}</dt>
          <dd className="font-label text-xs leading-[1.45] text-ink md:text-[13px]">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function HeroCopy({ hero, className }: { readonly hero: Hero; readonly className?: string }): ReactNode {
  return (
    <Reveal trigger="mount" delay={COPY_DELAY_S} className={className}>
      <div className="flex max-w-[34rem] flex-col gap-6">
        <p className="font-display text-[length:clamp(2rem,4vw,4rem)] font-semibold leading-none tracking-[-0.04em] text-signal">
          {hero.role}
        </p>
        <p className="max-w-[38ch] text-[17px] leading-[1.55] text-ink-soft lg:text-[19px]">{hero.summary}</p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={hero.primary.href}>{hero.primary.label}</ButtonLink>
          <ButtonLink href={hero.secondary.href} variant="secondary">
            {hero.secondary.label}
          </ButtonLink>
        </div>
        <Facts facts={hero.facts} />
      </div>
    </Reveal>
  );
}

/**
 * The hero composition: name and copy on the left, the portrait framed by the orange circle on
 * the right. Nothing overlaps the name. Every moving layer uses transforms and opacity only.
 */
export function HeroStage({ hero }: { readonly hero: Hero }): ReactNode {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() === true;
  const { scrollYProgress } = useScroll({ target: rootRef, offset: ["start start", "end start"] });
  const pointer = usePointerDepth(!reduced);

  const nameY = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "-8%"]);
  // Positive drift: the circle lags behind the page as it scrolls away.
  const circleY = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "12%"]);

  return (
    <div ref={rootRef} className="relative flex min-h-dvh flex-col justify-center overflow-hidden bg-grid">
      <Container className="relative z-10 pb-16 pt-28">
        <div className="flex flex-col gap-y-8 lg:grid lg:grid-cols-[58fr_42fr] lg:items-center lg:gap-x-10 lg:gap-y-8">
          <DepthLayer
            y={nameY}
            pointer={pointer}
            travel={NAME_POINTER_TRAVEL}
            className="lg:col-start-1 lg:row-start-1"
          >
            <HeroName name={hero.name} />
          </DepthLayer>

          <div className="relative my-12 aspect-square w-[78vw] max-w-[22rem] self-center lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:my-16 lg:w-[min(34vw,62dvh,30rem)] lg:max-w-none lg:justify-self-center">
            <PortraitFrame portrait={hero.portrait} pointer={pointer} y={circleY} className="relative size-full" />
          </div>

          <HeroCopy hero={hero} className="lg:col-start-1 lg:row-start-2" />
        </div>
      </Container>
    </div>
  );
}
