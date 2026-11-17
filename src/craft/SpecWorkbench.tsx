"use client";

import { useInView } from "motion/react";
import { useMemo, useRef, useState, type ReactNode } from "react";
import type { Craft } from "@/content";
import { cx } from "@/ui";
import { SpecAnnotator } from "./SpecAnnotator";
import { SpecOverlay } from "./SpecOverlay";
import { SpecimenCard } from "./SpecimenCard";
import { useSpecMeasure } from "./useSpecMeasure";

const AUTO_REVEAL_AMOUNT = 0.5;

type SpecWorkbenchProps = Readonly<{
  craft: Craft;
  /** The demo caption is rendered on the server and slotted in above the toggle. */
  header: ReactNode;
}>;

/** Owns the state the two columns share: whether the spec is shown and the specimen's switch. */
export function SpecWorkbench({ craft, header }: SpecWorkbenchProps): ReactNode {
  const stageRef = useRef<HTMLDivElement>(null);
  const seen = useInView(stageRef, { amount: AUTO_REVEAL_AMOUNT, once: true });
  // The spec turns itself on once when the stage is seen; after that the visitor decides.
  const [chosen, setChosen] = useState<boolean | null>(null);
  const on = chosen ?? seen;

  const [enabled, setEnabled] = useState(true);
  const [pulse, setPulse] = useState(0);

  const measure = useSpecMeasure(stageRef);
  const annotator = useMemo(() => new SpecAnnotator(craft.notes.map((note) => note.id)), [craft.notes]);
  const layout = useMemo(() => (measure === null ? null : annotator.annotate(measure)), [annotator, measure]);
  const legend = layout?.mode === "legend";

  return (
    <div className="grid gap-14 lg:grid-cols-12 lg:gap-12">
      <div className="flex flex-col items-start gap-10 lg:col-span-5">
        {header}
        <button
          type="button"
          aria-pressed={on}
          onClick={() => setChosen(!on)}
          className={cx(
            "inline-flex h-11 items-center justify-center gap-3 rounded-[4px] border px-5 font-label font-medium text-xs uppercase tracking-[0.14em] transition-colors duration-300 ease-out-expo",
            on ? "border-ink bg-ink text-paper hover:bg-signal hover:text-ink" : "border-line-strong text-ink hover:border-ink",
          )}
        >
          <span aria-hidden className={cx("size-1.5 transition-colors duration-300", on ? "bg-signal" : "bg-line-strong")} />
          {on ? craft.toggle.hide : craft.toggle.show}
        </button>
      </div>

      <div className="lg:col-span-7">
        <div
          ref={stageRef}
          className="relative flex min-h-[26rem] items-center justify-center rounded-lg border border-line bg-paper-sunk bg-grid lg:aspect-[4/3]"
        >
          <SpecimenCard
            specimen={craft.specimen}
            enabled={enabled}
            showFocus={on}
            onToggle={() => {
              setEnabled((value) => !value);
              setPulse((value) => value + 1);
            }}
          />
          {layout !== null && <SpecOverlay layout={layout} notes={craft.notes} on={on} pulse={pulse} />}
        </div>

        <ol className={cx(legend && on ? "mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2" : "sr-only")}>
          {craft.notes.map((note, index) => (
            <li key={note.id} className="flex gap-3 font-label font-medium text-[11px] uppercase leading-5 tracking-[0.12em]">
              <span aria-hidden className="flex size-5 shrink-0 items-center justify-center bg-signal text-[10px] text-ink">
                {index + 1}
              </span>
              <span className="text-mute">{note.label}</span>
              <span className="text-ink">{note.value}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
