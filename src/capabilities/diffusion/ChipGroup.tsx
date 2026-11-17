import type { ReactNode } from "react";
import type { DiffusionOption } from "@/content";
import { cx } from "@/ui";

type ChipGroupProps<Id extends string> = Readonly<{
  label: string;
  options: readonly DiffusionOption<Id>[];
  selected: Id;
  onSelect: (id: Id) => void;
}>;

/** One row of single-choice chips; the chosen one is filled ink. Wraps onto more lines on a narrow screen. */
export function ChipGroup<Id extends string>({ label, options, selected, onSelect }: ChipGroupProps<Id>): ReactNode {
  return (
    <div role="group" aria-label={label} className="flex min-w-0 flex-col gap-1.5">
      <p aria-hidden className="text-[11px] font-semibold uppercase tracking-[0.1em] text-mute">
        {label}
      </p>
      <div className="flex min-w-0 flex-wrap gap-1.5">
        {options.map((option) => {
          const on = option.id === selected;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={on}
              onClick={() => onSelect(option.id)}
              className={cx(
                "cursor-pointer rounded-full border px-3 py-1.5 text-[13px] font-medium leading-4 transition-[background-color,color,border-color,transform] duration-200 active:scale-95 motion-reduce:transition-none",
                on
                  ? "border-ink bg-ink text-white"
                  : "border-line-strong bg-white text-ink-soft hover:border-ink hover:text-ink",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
