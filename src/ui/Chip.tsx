import type { ReactNode } from "react";

/** Small hairline pill for tags and sources. */
export function Chip({ children }: { readonly children: ReactNode }): ReactNode {
  return (
    <span className="inline-flex items-center rounded-full border border-line px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-bone-dim">
      {children}
    </span>
  );
}
