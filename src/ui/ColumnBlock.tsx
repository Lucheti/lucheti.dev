import type { ReactNode } from "react";

type ColumnBlockProps = Readonly<{
  /** The title's id; the block names itself with it. */
  id: string;
  title: string;
  children: ReactNode;
}>;

/**
 * A titled block in a chapter's narrow column, such as "Reference projects" or "Skills": a small title, then
 * its content. A lighter landmark than `SubsectionHeader`, sized for the column.
 */
export function ColumnBlock({ id, title, children }: ColumnBlockProps): ReactNode {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <h3 id={id} className="font-display text-xl font-semibold tracking-[-0.025em] text-ink">
        {title}
      </h3>
      {children}
    </section>
  );
}
