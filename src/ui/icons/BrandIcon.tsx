import type { ReactNode } from "react";
import type { ToolIcon } from "./toolIcons";

type BrandIconProps = Readonly<{
  icon: ToolIcon;
  /** Size and spacing; the colour is always the text colour. */
  className?: string;
}>;

/** A brand mark drawn in the current text colour, so every icon reads as one system. Decorative. */
export function BrandIcon({ icon, className }: BrandIconProps): ReactNode {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false" className={className}>
      <path d={icon.path} fill="currentColor" />
    </svg>
  );
}
