"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import Image from "next/image";
import { useEffect, useRef, type ReactNode } from "react";
import type { Hero } from "@/content";
import { ButtonLink, Container, EASE_OUT_EXPO, Label, Reveal, cx } from "@/ui";
import { SheetFrame } from "./SheetFrame";

const LETTER_STAGGER_S = 0.04;
const PORTRAIT_DELAY_S = 0.15;
const COPY_DELAY_S = 1.0;
const FINE_POINTER = "(pointer: fine)";
const SPRING = { stiffness: 90, damping: 22, mass: 0.7 } as const;

/** How far each layer drifts with the pointer, in px at the screen edge. */
const POINTER_TRAVEL = { name: 6, portrait: 10, disc: -18 } as const;

/** The disc is centred on the head: 52% across and 30% down the portrait. */
const HEAD = { x: "52%", y: "30%" } as const;
const DISC_RATIO = 0.46;

type Pointer = Readonly<{ x: MotionValue<number>; y: MotionValue<number> }>;

/** Normalised pointer position (-1 … 1), damped by a spring. Idle for touch and reduced motion. */
function usePointerDepth(enabled: boolean): Pointer {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING);
  const y = useSpring(rawY, SPRING);

  useEffect(() => {
    if (!enabled || !window.matchMedia(FINE_POINTER).matches) {
      return undefined;
    }
    const onMove = (event: PointerEvent): void => {
      rawX.set((event.clientX / window.innerWidth) * 2 - 1);
      rawY.set((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled, rawX, rawY]);

  return { x, y };
}

type DepthLayerProps = Readonly<{
  /** Scroll-driven vertical travel, as a percentage of the layer's own height. */
  y: MotionValue<string>;
  scale?: MotionValue<number>;
  pointer: Pointer;
  /** Pointer travel in px at the screen edge; the sign sets the direction. */
  travel: number;
  className?: string;
  originY?: string;
  children: ReactNode;
}>;

/** Two nested transform layers: scroll on the outside, pointer on the inside. */
function DepthLayer({ y, scale, pointer, travel, className, originY = "50%", children }: DepthLayerProps): ReactNode {
  const x = useTransform(pointer.x, (value) => value * travel);
  const driftY = useTransform(pointer.y, (value) => value * travel);
  return (
    <motion.div className={className} style={{ y, scale, transformOrigin: `50% ${originY}` }}>
      <motion.div className="size-full" style={{ x, y: driftY }}>
        {children}
      </motion.div>
    </motion.div>
  );
}

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

function HeroName({ name }: { readonly name: Hero["name"] }): ReactNode {
  const [first, last] = name;
  return (
    <h1
      aria-label={name.join(" ")}
      // Capped by height as well as width: two lines must end above the copy block on short screens.
      className="font-display text-[clamp(4.5rem,min(19vw,23dvh),21rem)] font-bold uppercase leading-[0.82] tracking-[-0.06em] text-ink"
    >
      <NameLine text={first} firstIndex={0} />
      <NameLine text={last} firstIndex={Array.from(first).length} />
    </h1>
  );
}

function Facts({ facts }: { readonly facts: Hero["facts"] }): ReactNode {
  return (
    <dl className="grid grid-cols-3 gap-x-4 border-t border-line pt-4">
      {facts.map((fact) => (
        <div key={fact.label} className="flex flex-col gap-1.5">
          <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-mute">{fact.label}</dt>
          <dd className="font-mono text-xs leading-[1.45] text-ink md:text-[13px]">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function HeroCopy({ hero }: { readonly hero: Hero }): ReactNode {
  const [first, second] = hero.tagline;
  return (
    <Reveal trigger="mount" delay={COPY_DELAY_S} className="flex max-w-[30rem] flex-col gap-6">
      <Label marked>{hero.role}</Label>
      <p className="font-display text-[clamp(1.5rem,2.6vw,2.25rem)] font-semibold leading-[1.1] tracking-[-0.03em]">
        <span className="block text-ink">{first}</span>
        <span className="block text-signal">{second}</span>
      </p>
      <div className="flex flex-wrap gap-3">
        <ButtonLink href={hero.primary.href}>{hero.primary.label}</ButtonLink>
        <ButtonLink href={hero.secondary.href} variant="secondary">
          {hero.secondary.label}
        </ButtonLink>
      </div>
      <Facts facts={hero.facts} />
    </Reveal>
  );
}

/**
 * The hero composition. From back to front: name, orange disc, portrait, copy.
 * Every moving layer uses transforms and opacity only.
 */
export function HeroStage({ hero }: { readonly hero: Hero }): ReactNode {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() === true;
  const { scrollYProgress } = useScroll({ target: rootRef, offset: ["start start", "end start"] });
  const pointer = usePointerDepth(!reduced);

  const nameY = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "-10%"]);
  const portraitY = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "-18%"]);
  const portraitScale = useTransform(scrollYProgress, [0, 1], [1, reduced ? 1 : 0.94]);
  const discY = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "-30%"]);
  const discScale = useTransform(scrollYProgress, [0, 1], [1, reduced ? 1 : 1.25]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.6], [1, reduced ? 1 : 0]);

  const { portrait } = hero;

  return (
    <div ref={rootRef} className="relative flex min-h-dvh flex-col overflow-hidden bg-grid lg:block">
      <SheetFrame sheet={hero.sheet} />

      <DepthLayer
        y={nameY}
        pointer={pointer}
        travel={POINTER_TRAVEL.name}
        className="relative z-0 pt-24 lg:absolute lg:inset-x-0 lg:top-28"
      >
        <Container>
          <HeroName name={hero.name} />
        </Container>
      </DepthLayer>

      <div
        className="relative z-10 mx-auto -mt-10 h-[62dvh] lg:absolute lg:bottom-0 lg:left-[66%] lg:mx-0 lg:mt-0 lg:h-[92dvh] lg:-translate-x-1/2"
        style={{ aspectRatio: `${portrait.width} / ${portrait.height}` }}
      >
        <div
          className="absolute aspect-square -translate-x-1/2 -translate-y-1/2"
          style={{ left: HEAD.x, top: HEAD.y, height: `${DISC_RATIO * 100}%` }}
        >
          <DepthLayer y={discY} scale={discScale} pointer={pointer} travel={POINTER_TRAVEL.disc} className="size-full">
            <motion.div
              aria-hidden
              className="size-full rounded-full bg-signal"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
            />
          </DepthLayer>
        </div>

        <DepthLayer
          y={portraitY}
          scale={portraitScale}
          pointer={pointer}
          travel={POINTER_TRAVEL.portrait}
          originY="100%"
          className="absolute inset-0"
        >
          <motion.div
            className="size-full"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: PORTRAIT_DELAY_S, ease: EASE_OUT_EXPO }}
          >
            <Image
              src={portrait.src}
              alt={portrait.alt}
              width={portrait.width}
              height={portrait.height}
              priority
              sizes="(min-width: 1024px) 50vw, 80vw"
              className="size-full select-none"
              draggable={false}
            />
          </motion.div>
        </DepthLayer>
      </div>

      <motion.div
        style={{ opacity: copyOpacity }}
        className={cx("relative z-20 px-6 pb-20 pt-8 md:px-10", "lg:absolute lg:inset-x-0 lg:bottom-14 lg:p-0")}
      >
        <Container className="px-0 md:px-0 lg:px-16">
          <HeroCopy hero={hero} />
        </Container>
      </motion.div>
    </div>
  );
}
