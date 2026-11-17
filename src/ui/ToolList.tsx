import { Fragment, type ReactNode } from "react";
import { cx } from "./cx";

type ToolListProps = Readonly<{
  tools: readonly string[];
  /** Classes for the " · " separator, e.g. its colour. */
  separator: string;
}>;

/** Tools as plain text joined by a muted " · "; each tool never breaks, the lines break between tools. */
export function ToolList({ tools, separator }: ToolListProps): ReactNode {
  return (
    <>
      {tools.map((tool, index) => (
        <Fragment key={tool}>
          {index > 0 && (
            <>
              <span aria-hidden className={cx("ml-2 mr-1", separator)}>
                ·
              </span>
              <span className="sr-only">,</span>
              {/* The space is the line-break opportunity between nowrap tools. */}{" "}
            </>
          )}
          <span className="whitespace-nowrap">{tool}</span>
        </Fragment>
      ))}
    </>
  );
}
