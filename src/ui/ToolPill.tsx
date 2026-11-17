import type { ReactNode } from "react";
import { cx } from "./cx";
import { BrandIcon, toolIcon } from "./icons";
import type { Tone } from "./Tone";

const PILL = "inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium leading-5";

const SKINS: Readonly<Record<Tone, string>> = {
  light: "border-line-strong bg-paper/70 text-ink",
  dark: "border-line-dark-strong text-fog",
};

type ToolPillProps = Readonly<{
  tool: string;
  tone?: Tone;
}>;

/** One tool as a rounded pill, led by its brand mark when the tool has an official one. */
export function ToolPill({ tool, tone = "light" }: ToolPillProps): ReactNode {
  const icon = toolIcon(tool);
  return (
    <span className={cx(PILL, SKINS[tone])}>
      {icon ? <BrandIcon icon={icon} className="size-3.5 shrink-0" /> : null}
      <span className="min-w-0">{tool}</span>
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
