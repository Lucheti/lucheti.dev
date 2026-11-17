import type { ReactNode } from "react";
import { cx } from "../cx";

type FeaturePanelProps = Readonly<{
  /** What the panel shows, in a sentence, for screen readers. */
  label: string;
  title: string;
  /** Drawn before the title, e.g. a brand swatch. */
  lead?: ReactNode;
  /** Drawn at the right end of the title row. */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}>;

/**
 * The graphite card beside a domain chapter's heading: a title row, then one real-looking component
 * made in code. The sentence in `label` is its caption for assistive technology.
 */
export function FeaturePanel({ label, title, lead, aside, children, className }: FeaturePanelProps): ReactNode {
  return (
    <figure
      className={cx(
        "relative flex min-h-[22rem] min-w-0 flex-col overflow-hidden rounded-2xl bg-graphite p-5 text-fog shadow-[0_40px_80px_-40px_rgb(14_14_14/0.55)] ring-1 ring-inset ring-fog/8 sm:p-6 md:min-h-[24rem] md:p-8",
        className,
      )}
    >
      <figcaption className="sr-only">{label}</figcaption>
      <div className="flex min-w-0 items-center justify-between gap-4">
        <p className="flex min-w-0 items-center gap-2.5 text-[15px] font-semibold tracking-[-0.01em] text-fog">
          {lead}
          <span className="truncate">{title}</span>
        </p>
        {aside}
      </div>
      <div className="mt-6 flex min-w-0 flex-1 flex-col">{children}</div>
    </figure>
  );
}
