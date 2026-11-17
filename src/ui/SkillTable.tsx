import type { ReactNode } from "react";
import type { SkillArea } from "@/content";
import { cx } from "./cx";
import type { Tone } from "./Tone";
import { ToolPills } from "./ToolPill";

type SkillTableProps = Readonly<{
  areas: readonly SkillArea[];
  /** Visually hidden table caption, e.g. "Front end skills". */
  caption: string;
  /** Column labels; the defaults suit every domain. */
  columns?: Readonly<{ area: string; tools: string }>;
  tone?: Tone;
}>;

const DEFAULT_COLUMNS = { area: "Area", tools: "Libraries & tools" } as const;

type TableSkin = Readonly<{ rule: string; name: string; summary: string; head: string }>;

const SKINS: Readonly<Record<Tone, TableSkin>> = {
  light: {
    rule: "border-line",
    name: "text-ink",
    summary: "text-ink-soft",
    head: "text-mute",
  },
  dark: {
    rule: "border-line-dark",
    name: "text-fog",
    summary: "text-fog-dim",
    head: "text-fog-dim",
  },
};

const LABEL_CAPS = "font-label font-medium text-[11px] uppercase tracking-[0.14em]";

/**
 * A resume skill table: each area with its summary, then the libraries used in it as pills.
 * Real table semantics (explicit roles) are kept while the rows stack on narrow screens.
 */
export function SkillTable({ areas, caption, columns = DEFAULT_COLUMNS, tone = "light" }: SkillTableProps): ReactNode {
  const skin = SKINS[tone];
  return (
    <table role="table" className="block w-full text-left">
      <caption className="sr-only">{caption}</caption>
      <thead role="rowgroup" className="sr-only lg:not-sr-only lg:block">
        <tr role="row" className={cx("block border-b pb-3 lg:grid lg:grid-cols-12 lg:gap-x-8", skin.rule)}>
          <th role="columnheader" scope="col" className={cx("block lg:col-span-4", LABEL_CAPS, skin.head)}>
            {columns.area}
          </th>
          <th role="columnheader" scope="col" className={cx("block lg:col-span-8", LABEL_CAPS, skin.head)}>
            {columns.tools}
          </th>
        </tr>
      </thead>
      <tbody role="rowgroup" className="block">
        {areas.map((area) => (
          <tr
            key={area.name}
            role="row"
            className={cx("block border-b py-6 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-8", skin.rule)}
          >
            <th role="rowheader" scope="row" className="block text-left font-normal lg:col-span-4">
              <span className={cx("block font-display text-xl font-semibold tracking-[-0.02em]", skin.name)}>
                {area.name}
              </span>
              <span className={cx("mt-1 block text-sm leading-[1.5]", skin.summary)}>{area.summary}</span>
            </th>
            <td role="cell" className="mt-4 block lg:col-span-8 lg:mt-0">
              <ToolPills tools={area.tools} tone={tone} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
