import type { ReactNode } from "react";
import { cx } from "./cx";
import { ToolSwatch } from "./icons";
import type { Tone } from "./Tone";

const PILL = "inline-flex max-w-full items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm font-medium leading-5";

const SKINS: Readonly<Record<Tone, string>> = {
  light: "border-line-strong bg-paper/70 text-ink",
  dark: "border-line-dark-strong text-fog",
};

type ToolPillProps = Readonly<{
  tool: string;
  tone?: Tone;
}>;

/** One tool as a rounded pill, led by a circle in its brand colour (or its initial when it has no mark). */
export function ToolPill({ tool, tone = "light" }: ToolPillProps): ReactNode {
  return (
    <span className={cx(PILL, SKINS[tone])}>
      <ToolSwatch tool={tool} tone={tone} />
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
