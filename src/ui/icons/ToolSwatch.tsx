import type { ReactNode } from "react";
import { cx } from "../cx";
import type { Tone } from "../Tone";
import { BrandIcon } from "./BrandIcon";
import { brandSwatch } from "./BrandSwatch";
import { toolIcon } from "./toolIcons";

/** How large a swatch is drawn: `sm` leads a pill, `md` and `lg` sit on the feature panels. */
export type SwatchSize = "sm" | "md" | "lg";

type SizeSkin = Readonly<{ circle: string; icon: string; letter: string }>;

const SIZES: Readonly<Record<SwatchSize, SizeSkin>> = {
  sm: { circle: "size-5", icon: "size-3", letter: "text-[10px]" },
  md: { circle: "size-7", icon: "size-4", letter: "text-xs" },
  lg: { circle: "size-9", icon: "size-5", letter: "text-sm" },
};

/** The grounds a swatch is judged against; they mirror `--color-paper` and `--color-graphite`. */
const GROUNDS: Readonly<Record<Tone, string>> = {
  light: "#f3f2ee",
  dark: "#121212",
};

/** A tool with no mark: a neutral tint behind its first letter. */
const NEUTRAL: Readonly<Record<Tone, string>> = {
  light: "bg-ink/8 text-ink",
  dark: "bg-fog/12 text-fog",
};

/** On graphite every circle gets a hairline, so black brands (Next.js, Express, GitHub) still read. */
const DARK_RING = "ring-1 ring-inset ring-fog/20";
/** On paper only fills that melt into it (TanStack's cream) get one. */
const LIGHT_EDGE = "ring-1 ring-inset ring-ink/15";

const CIRCLE = "inline-flex shrink-0 items-center justify-center rounded-full";

type ToolSwatchProps = Readonly<{
  /** The tool label, exactly as the content writes it. */
  tool: string;
  tone?: Tone;
  size?: SwatchSize;
  className?: string;
}>;

/**
 * A tool as a circle in its brand colour with its mark inside, in white or near-black by contrast.
 * Tools without an official mark get a neutral circle with their initial. Decorative: the label is
 * always written next to it.
 */
export function ToolSwatch({ tool, tone = "light", size = "sm", className }: ToolSwatchProps): ReactNode {
  const skin = SIZES[size];
  const icon = toolIcon(tool);
  const ring = tone === "dark" ? DARK_RING : undefined;

  if (icon === undefined) {
    return (
      <span aria-hidden className={cx(CIRCLE, skin.circle, NEUTRAL[tone], ring, className)}>
        <span className={cx("font-semibold leading-none", skin.letter)}>{tool.charAt(0).toUpperCase()}</span>
      </span>
    );
  }

  const swatch = brandSwatch(icon.hex, GROUNDS[tone]);
  const edge = ring ?? (swatch.edge ? LIGHT_EDGE : undefined);
  return (
    <span
      aria-hidden
      className={cx(CIRCLE, skin.circle, edge, className)}
      style={{ backgroundColor: swatch.fill, color: swatch.ink }}
    >
      <BrandIcon icon={icon} className={skin.icon} />
    </span>
  );
}
