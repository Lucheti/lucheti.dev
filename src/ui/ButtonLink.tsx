import type { ReactNode } from "react";
import { cx } from "./cx";
import type { Tone } from "./Tone";

type ButtonVariant = "primary" | "secondary";

type ButtonLinkProps = Readonly<{
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  tone?: Tone;
}>;

const VARIANT_CLASSES: Readonly<Record<Tone, Readonly<Record<ButtonVariant, string>>>> = {
  light: {
    primary: "bg-ink text-paper hover:bg-signal hover:text-ink",
    secondary: "border border-line-strong text-ink hover:border-ink",
  },
  dark: {
    primary: "bg-fog text-graphite hover:bg-signal",
    secondary: "border border-line-dark-strong text-fog hover:border-fog",
  },
};

function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}

/** Squared-off link button. External destinations open in a new tab. */
export function ButtonLink({ href, children, variant = "primary", tone = "light" }: ButtonLinkProps): ReactNode {
  const classes = cx(
    "inline-flex h-11 items-center justify-center gap-3 rounded-[4px] px-5 font-label font-medium text-xs uppercase tracking-[0.14em]",
    "transition-colors duration-300 ease-out-expo",
    VARIANT_CLASSES[tone][variant],
  );

  if (isExternal(href)) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
        {children}
        <span aria-hidden>↗</span>
      </a>
    );
  }

  return (
    <a href={href} className={classes}>
      {children}
      <span aria-hidden>→</span>
    </a>
  );
}
