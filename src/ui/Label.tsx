import type { ReactNode } from "react";
import { cx } from "./cx";

type LabelProps = Readonly<{
  children: ReactNode;
  /** Prefixes the label with a small lime square. */
  marked?: boolean;
  className?: string;
}>;

/** Small uppercase mono caption used for eyebrows and section labels. */
export function Label({ children, marked = false, className }: LabelProps): ReactNode {
  return (
    <p
      className={cx(
        "flex items-center gap-3 font-mono text-xs uppercase tracking-[0.14em] text-bone-dim",
        className,
      )}
    >
      {marked && <span aria-hidden className="size-1.5 bg-lime" />}
      {children}
    </p>
  );
}
