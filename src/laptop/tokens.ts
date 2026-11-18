/**
 * The class strings every app on the laptop's screen shares, so the apps read as one family: warm inks on
 * white and paper, hairlines in a translucent brown, and the signal orange as the only accent.
 */

/** Hover and press, for the visitor's pointer and for the ghost's. */
export const PRESSABLE =
  "transition-colors duration-150 hover:bg-[rgb(60_30_15/0.055)] data-[ghost-over]:bg-[rgb(60_30_15/0.055)] active:bg-[rgb(60_30_15/0.1)] data-[ghost-press]:bg-[rgb(60_30_15/0.1)] motion-reduce:transition-none";

/** A small grey count beside a title. */
export const COUNT_PILL = "rounded-full bg-[rgb(60_30_15/0.06)] px-[7px] py-[2px] text-[11.5px] font-medium tabular-nums text-[#6b615b]";

/** A white tag with a hairline edge, like a task's label. */
export const TAG_PILL = "rounded-full bg-white shadow-[inset_0_0_0_0.5px_rgb(60_30_15/0.18),0_0.5px_1px_rgb(60_30_15/0.06)]";

/** A tiny tinted word, like "New" on a task that just arrived. */
export const WORD_PILL = "shrink-0 rounded-full px-[6px] py-[2px] text-[10.5px] font-semibold leading-none";

/** The apps' inks, darkest first. */
export const INK = {
  strong: "#1d1612",
  body: "#3b3330",
  muted: "#8a7f78",
  faint: "#b3aaa4",
} as const;
