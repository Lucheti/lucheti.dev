import type { ReactNode } from "react";
import { cx } from "./cx";

type ButtonVariant = "primary" | "secondary";

type ButtonLinkProps = Readonly<{
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
}>;

const VARIANT_CLASSES: Readonly<Record<ButtonVariant, string>> = {
  primary: "bg-lime text-ink hover:bg-bone",
  secondary: "border border-line-strong text-bone hover:border-bone",
};

function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}

/** Pill-shaped link. External destinations open in a new tab. */
export function ButtonLink({ href, children, variant = "primary" }: ButtonLinkProps): ReactNode {
  const classes = cx(
    "inline-flex h-12 items-center justify-center rounded-full px-7 text-[15px] font-medium",
    "transition-colors duration-300 ease-out-expo",
    VARIANT_CLASSES[variant],
  );

  if (isExternal(href)) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <a href={href} className={classes}>
      {children}
    </a>
  );
}
