import type { ReactNode } from "react";
import { cx } from "./cx";
import { ToolSwatch, type SwatchSize } from "./icons";
import type { Tone } from "./Tone";

const PILL = "inline-flex max-w-full items-center rounded-full border font-medium";

/** `md` is the everyday pill; `lg` is the larger one on the Capabilities wall. */
export type PillSize = "md" | "lg";

type PillSizeSkin = Readonly<{ pill: string; label: string; swatch: SwatchSize }>;

const PILL_SIZES: Readonly<Record<PillSize, PillSizeSkin>> = {
  md: { pill: "gap-2 py-1 pl-1 pr-3 text-sm leading-5", label: "min-w-0", swatch: "sm" },
  // The wall scrolls sideways, so its labels never wrap.
  lg: { pill: "gap-2.5 py-1.5 pl-1.5 pr-4 text-base leading-6", label: "whitespace-nowrap", swatch: "md" },
};

const SKINS: Readonly<Record<Tone, string>> = {
  light: "border-line-strong bg-paper/70 text-ink",
  dark: "border-line-dark-strong text-fog",
};

type ToolPillProps = Readonly<{
  tool: string;
  tone?: Tone;
  size?: PillSize;
}>;

/** One tool as a rounded pill, led by a circle in its brand colour (or its initial when it has no mark). */
export function ToolPill({ tool, tone = "light", size = "md" }: ToolPillProps): ReactNode {
  const skin = PILL_SIZES[size];
  return (
    <span className={cx(PILL, skin.pill, SKINS[tone])}>
      <ToolSwatch tool={tool} tone={tone} size={skin.swatch} />
      <span className={skin.label}>{tool}</span>
    </span>
  );
}

type ToolPillsProps = Readonly<{
  tools: readonly string[];
  tone?: Tone;
  className?: string;
}>;

/** A list of tool pills that wraps onto as many lines as it needs. */
export function ToolPills({ tools, tone = "light", className }: ToolPillsProps): ReactNode {
  return (
    <ul className={cx("flex flex-wrap gap-2", className)}>
      {tools.map((tool) => (
        <li key={tool} className="flex min-w-0 max-w-full">
          <ToolPill tool={tool} tone={tone} />
        </li>
      ))}
    </ul>
  );
}
