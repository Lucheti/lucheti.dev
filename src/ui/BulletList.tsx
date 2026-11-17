import type { ReactNode } from "react";
import { cx } from "./cx";
import type { Tone } from "./Tone";

/** Numbered list with mono indices. Renders nothing when empty. */
export function BulletList({ items, tone = "light" }: { readonly items: readonly string[]; readonly tone?: Tone }): ReactNode {
  if (items.length === 0) {
    return null;
  }
  return (
    <ol className="flex flex-col gap-3">
      {items.map((item, index) => (
        <li key={item} className={cx("flex gap-4 leading-[1.5]", tone === "light" ? "text-ink-soft" : "text-fog-dim")}>
          <span aria-hidden className="w-6 shrink-0 pt-[0.2em] font-label text-[11px] text-signal">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}
