"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import type { DiffusionPanel, DiffusionFraming, DiffusionMood, DiffusionSubject } from "@/content";
import { cx, FeaturePanel, usePanelLoop } from "@/ui";
import { ChipGroup } from "./ChipGroup";
import { DiffusionSchedule } from "./DiffusionSchedule";
import { GalleryStrip, GALLERY_SIZE } from "./GalleryStrip";
import { GenerationHistory, type Generation } from "./Generation";
import { PromptSentence } from "./PromptSentence";
import { SceneRecipe, type PromptChips } from "./SceneRecipe";
import { SceneSvg } from "./SceneSvg";
import { SeededRandom } from "./SeededRandom";
import { useDenoise } from "./useDenoise";

/** What the panel rests on before anyone touches it. */
const DEFAULT_CHIPS: PromptChips = { subject: "lighthouse", mood: "dusk", framing: "wide" };
const DEFAULT_SEED = 11;
const STEPS = 20;
const RUN_MS = 3800;

/** The orange spark that leads the title. */
function Spark(): ReactNode {
  return (
    <span aria-hidden className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-signal text-ink">
      <svg viewBox="0 0 16 16" className="size-4">
        <path d="M8 1.5l1.5 4.2 4.2 1.5-4.2 1.5L8 12.9 6.5 8.7 2.3 7.2l4.2-1.5z" fill="currentColor" />
      </svg>
    </span>
  );
}

function ShuffleIcon(): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-4">
      <path
        d="M2 4.5h2.5c3 0 4 7 7 7H14M2 11.5h2.5c1 0 1.800-.5 2.400-1.300M9.100 5.800C9.700 5 10.500 4.500 11.500 4.500H14M12 2.500l2 2-2 2M12 9.500l2 2-2 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The AI feature panel: "Tiny diffusion", a toy image generator. Three chip rows write a prompt, Generate
 * resolves a little picture out of grain, and the last four pictures wait in a strip. It is the composition
 * root of the toy: it builds the schedule and the seed source, and hands the rest what it needs.
 */
export function TinyDiffusionPanel({ panel }: Readonly<{ panel: DiffusionPanel }>): ReactNode {
  const rootRef = useRef<HTMLDivElement>(null);
  const active = usePanelLoop(rootRef);
  const reduced = useReducedMotion() === true;

  const [schedule] = useState(() => new DiffusionSchedule(STEPS, RUN_MS));
  const [dice] = useState(() => new SeededRandom(2026));
  const nextId = useRef(1);
  const introduced = useRef(false);

  const [first] = useState<Generation>(() => ({ id: 0, chips: DEFAULT_CHIPS, seed: DEFAULT_SEED }));
  const [chips, setChips] = useState<PromptChips>(first.chips);
  const [seed, setSeed] = useState(first.seed);
  const [shown, setShown] = useState<Generation>(first);
  const [history, setHistory] = useState(() => GenerationHistory.empty(GALLERY_SIZE).with(first));
  const [asked, setAsked] = useState(false);

  // A new picture joins the gallery only once it has resolved, so the strip never gives the result away.
  const pending = useRef<Generation | null>(null);
  const settle = useCallback((): void => {
    const resolved = pending.current;
    pending.current = null;
    if (resolved !== null) {
      setHistory((past) => past.with(resolved));
    }
  }, []);
  const { grainRef, frameRef, running, step, start, stop } = useDenoise({ schedule, active, onDone: settle });
  const scene = useMemo(() => SceneRecipe.compose(shown.chips, shown.seed), [shown]);
  const describe = (generation: Generation): string => PromptSentence.plain(generation.chips, panel.groups);

  // The first time the panel is seen, the opening picture resolves once on its own.
  useEffect(() => {
    if (active && !introduced.current) {
      introduced.current = true;
      start();
    }
  }, [active, start]);

  const generate = (nextChips: PromptChips, nextSeed: number): void => {
    const generation: Generation = { id: nextId.current, chips: nextChips, seed: nextSeed };
    nextId.current += 1;
    introduced.current = true;
    setAsked(true);
    setShown(generation);
    if (reduced) {
      pending.current = null;
      setHistory((past) => past.with(generation));
      stop();
    } else {
      pending.current = generation;
      start();
    }
  };

  const reroll = (): void => {
    if (running) {
      return;
    }
    const rolled = dice.int(1, 9999);
    setSeed(rolled);
    generate(chips, rolled);
  };

  const pick = (generation: Generation): void => {
    if (running) {
      // Picking from the strip cancels the run; the unfinished picture is not kept.
      pending.current = null;
      stop();
    }
    setChips(generation.chips);
    setSeed(generation.seed);
    setShown(generation);
  };

  const choose = {
    subject: (subject: DiffusionSubject): void => setChips((now) => ({ ...now, subject })),
    mood: (mood: DiffusionMood): void => setChips((now) => ({ ...now, mood })),
    framing: (framing: DiffusionFraming): void => setChips((now) => ({ ...now, framing })),
  };

  const sentence = PromptSentence.parts(chips, panel.groups);
  const status = !asked ? "" : running ? `${panel.generating}…` : `${panel.done}: ${PromptSentence.plain(shown.chips, panel.groups)}`;

  return (
    <FeaturePanel label={panel.label} title={panel.title} lead={<Spark />}>
      <div ref={rootRef} className="flex flex-1 flex-col gap-4">
        <p role="status" className="sr-only">
          {status}
        </p>

        <div className="grid min-w-0 flex-1 gap-5 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-paper-sunk ring-1 ring-inset ring-line">
              <div
                ref={frameRef}
                key={shown.id}
                className="absolute -inset-2 motion-safe:animate-[toy-fade_320ms_ease-out]"
              >
                <SceneSvg scene={scene} />
              </div>
              <canvas
                ref={grainRef}
                aria-hidden
                className="pointer-events-none absolute inset-0 size-full opacity-0 [image-rendering:pixelated]"
              />
              <span
                aria-hidden
                className={cx(
                  "absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-ink shadow-sm transition-opacity duration-300 motion-reduce:transition-none",
                  running ? "opacity-100" : "opacity-0",
                )}
              >
                Step {Math.max(1, step)}/{schedule.stepCount()}
              </span>
            </div>
            <GalleryStrip
              label={panel.gallery}
              generations={history.list()}
              current={shown}
              describe={describe}
              onPick={pick}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <p className="rounded-xl bg-paper-raised px-3.5 py-3 text-[15px] leading-6 text-ink-soft ring-1 ring-inset ring-line">
              {sentence.map((part, index) => (
                <span key={index} className={part.chosen ? "font-semibold text-signal-ink" : undefined}>
                  {part.text}
                </span>
              ))}
            </p>
            <ChipGroup
              label={panel.groups.subject.label}
              options={panel.groups.subject.options}
              selected={chips.subject}
              onSelect={choose.subject}
            />
            <ChipGroup
              label={panel.groups.mood.label}
              options={panel.groups.mood.options}
              selected={chips.mood}
              onSelect={choose.mood}
            />
            <ChipGroup
              label={panel.groups.framing.label}
              options={panel.groups.framing.options}
              selected={chips.framing}
              onSelect={choose.framing}
            />
            <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
              <button
                type="button"
                aria-disabled={running}
                onClick={() => {
                  if (!running) {
                    generate(chips, seed);
                  }
                }}
                className="cursor-pointer rounded-full bg-signal px-5 py-2.5 text-sm font-semibold text-ink transition-[filter,transform,opacity] duration-200 hover:brightness-105 active:scale-95 aria-disabled:cursor-progress aria-disabled:opacity-60 motion-reduce:transition-none"
              >
                {panel.generate}
              </button>
              <span className="inline-flex items-center gap-1.5 text-[13px] text-mute">
                <span>{panel.seed}</span>
                <span className="min-w-[2.6ch] font-semibold tabular-nums text-ink">{seed}</span>
                <button
                  type="button"
                  aria-label={panel.reroll}
                  title={panel.reroll}
                  aria-disabled={running}
                  onClick={reroll}
                  className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-line-strong text-ink transition-[transform,border-color] duration-200 hover:border-ink active:rotate-180 aria-disabled:cursor-progress aria-disabled:opacity-60 motion-reduce:transition-none"
                >
                  <ShuffleIcon />
                </button>
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs leading-5 text-mute">{panel.caption}</p>
      </div>
    </FeaturePanel>
  );
}
