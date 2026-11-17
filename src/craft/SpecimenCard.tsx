"use client";

import { useId, type ReactNode } from "react";
import type { Craft } from "@/content";
import { cx } from "@/ui";

/** The card's padding and radius in px; they mirror the `p-6` and `rounded-2xl` classes below. */
export const CARD_PADDING = 24;
export const CARD_RADIUS = 16;

type SpecimenCardProps = Readonly<{
  specimen: Craft["specimen"];
  enabled: boolean;
  onToggle: () => void;
  /** While the spec is on, the action button shows its focus ring. */
  showFocus: boolean;
}>;

function BubbleMark(): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="size-5 text-paper-raised">
      <path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h11A1.5 1.5 0 0 1 17 4.5v7a1.5 1.5 0 0 1-1.5 1.5H9l-3.6 3.2c-.4.3-.9.1-.9-.4V13h0A1.5 1.5 0 0 1 3 11.5z" fill="currentColor" />
    </svg>
  );
}

/** A small, working UI card. Its parts carry `data-spec` so the overlay can measure them. */
export function SpecimenCard({ specimen, enabled, onToggle, showFocus }: SpecimenCardProps): ReactNode {
  const labelId = useId();

  return (
    <div
      data-spec="card"
      className="relative w-[340px] max-w-[calc(100%-2rem)] rounded-2xl border border-line bg-paper-raised p-6 shadow-[0_1px_0_rgb(14_14_14/0.04),0_16px_32px_-20px_rgb(14_14_14/0.25)]"
    >
      <div className="flex items-center justify-between">
        <div data-spec="glyph" className="flex size-9 items-center justify-center rounded-[10px] bg-ink">
          <BubbleMark />
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-line px-2.5 py-1 font-label font-medium text-[11px] uppercase tracking-[0.12em] text-ink-soft">
          <span aria-hidden className="size-1.5 rounded-full bg-signal motion-safe:animate-pulse" />
          {specimen.status}
        </span>
      </div>

      <h3 data-spec="title" className="mt-4 w-fit font-display text-[15px] font-semibold leading-6 tracking-[-0.01em] text-ink">
        {specimen.title}
      </h3>
      <p data-spec="subtitle" className="w-fit text-[13px] leading-5 text-ink-soft">
        {specimen.subtitle}
      </p>

      <div className="mt-5 flex items-center justify-between gap-4 border-t border-line pt-4">
        <span id={labelId} className="text-[13px] text-ink">
          {specimen.switchLabel}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-labelledby={labelId}
          data-spec="toggle"
          onClick={onToggle}
          className={cx(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-[320ms] ease-out-expo",
            enabled ? "bg-ink" : "bg-line-strong",
          )}
        >
          <span
            aria-hidden
            className={cx(
              "absolute left-0.5 top-0.5 size-5 rounded-full bg-paper-raised transition-transform duration-[320ms] ease-out-expo",
              enabled && "translate-x-5",
            )}
          />
        </button>
      </div>

      <button
        type="button"
        data-spec="action"
        className={cx(
          "mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg border border-line-strong text-[13px] font-medium text-ink transition-colors duration-300 ease-out-expo hover:border-ink",
          showFocus && "outline-2 outline-offset-[3px] outline-signal",
        )}
      >
        {specimen.action}
      </button>
    </div>
  );
}
