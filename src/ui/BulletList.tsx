import type { ReactNode } from "react";

/** List with small lime square markers. Renders nothing when empty. */
export function BulletList({ items }: { readonly items: readonly string[] }): ReactNode {
  if (items.length === 0) {
    return null;
  }
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item} className="flex gap-4 leading-[1.6] text-bone-dim">
          <span aria-hidden className="mt-[0.6em] size-1.5 shrink-0 bg-lime" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
