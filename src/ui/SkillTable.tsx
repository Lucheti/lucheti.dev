import type { ReactNode } from "react";
import type { SkillArea } from "@/content";
import { cx } from "./cx";
import type { Tone } from "./Tone";
import { ToolList } from "./ToolList";

type SkillTableProps = Readonly<{
  areas: readonly SkillArea[];
  /** Visually hidden table caption, e.g. "Front end skills". */
  caption: string;
  /** Column labels; the defaults suit every domain. */
  columns?: Readonly<{ area: string; tools: string; where: string }>;
  tone?: Tone;
}>;

const DEFAULT_COLUMNS = { area: "Area", tools: "Libraries & tools", where: "Where" } as const;
const NO_EMPLOYER = "—";

type TableSkin = Readonly<{ rule: string; name: string; summary: string; tools: string; separator: string; where: string; head: string }>;

const SKINS: Readonly<Record<Tone, TableSkin>> = {
  light: {
    rule: "border-line",
    name: "text-ink",
    summary: "text-ink-soft",
    tools: "text-ink",
    separator: "text-mute",
    where: "text-mute",
    head: "text-mute",
  },
  dark: {
    rule: "border-line-dark",
    name: "text-fog",
    summary: "text-fog-dim",
    tools: "text-fog",
    separator: "text-fog-dim",
    where: "text-fog-dim",
    head: "text-fog-dim",
  },
};

const MONO_CAPS = "font-mono text-[11px] uppercase tracking-[0.14em]";

/**
 * A resume skill table: area and summary, the libraries used, and the employers where it was the job.
 * Real table semantics (explicit roles) are kept while the rows stack on narrow screens.
 */
export function SkillTable({ areas, caption, columns = DEFAULT_COLUMNS, tone = "light" }: SkillTableProps): ReactNode {
  const skin = SKINS[tone];
  return (
    <table role="table" className="block w-full text-left">
      <caption className="sr-only">{caption}</caption>
      <thead role="rowgroup" className="sr-only lg:not-sr-only lg:block">
        <tr role="row" className={cx("block border-b pb-3 lg:grid lg:grid-cols-12 lg:gap-x-8", skin.rule)}>
          <th role="columnheader" scope="col" className={cx("block font-normal lg:col-span-4", MONO_CAPS, skin.head)}>
            {columns.area}
          </th>
          <th role="columnheader" scope="col" className={cx("block font-normal lg:col-span-6", MONO_CAPS, skin.head)}>
            {columns.tools}
          </th>
          <th role="columnheader" scope="col" className={cx("block font-normal lg:col-span-2 lg:text-right", MONO_CAPS, skin.head)}>
            {columns.where}
          </th>
        </tr>
      </thead>
      <tbody role="rowgroup" className="block">
        {areas.map((area) => (
          <tr
            key={area.name}
            role="row"
            className={cx("block border-b py-6 lg:grid lg:grid-cols-12 lg:gap-x-8", skin.rule)}
          >
            <th role="rowheader" scope="row" className="block text-left font-normal lg:col-span-4">
              <span className={cx("block font-display text-xl font-semibold tracking-[-0.02em]", skin.name)}>
                {area.name}
              </span>
              <span className={cx("mt-1 block text-sm leading-[1.5]", skin.summary)}>{area.summary}</span>
            </th>
            <td
              role="cell"
              className={cx("mt-3 block text-base font-medium leading-[1.7] lg:col-span-6 lg:mt-0", skin.tools)}
            >
              <ToolList tools={area.tools} separator={skin.separator} />
            </td>
            <td
              role="cell"
              className={cx("mt-3 block lg:col-span-2 lg:mt-0 lg:text-right", MONO_CAPS, skin.where)}
            >
              {area.where.length === 0 ? (
                <>
                  <span aria-hidden>{NO_EMPLOYER}</span>
                  <span className="sr-only">None</span>
                </>
              ) : (
                area.where.join(", ")
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
