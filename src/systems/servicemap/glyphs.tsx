import type { ReactNode } from "react";
import { LINE, type GlyphProps } from "@/laptop";

/**
 * The ops app's own line icons, on the laptop kit's 16 px grid in `currentColor`. All decorative: the
 * buttons and cards around them carry the names.
 */

/** Clients: a browser window with a phone in front of it. */
export function ClientsGlyph({ className }: GlyphProps): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className}>
      <rect x="1.75" y="2.75" width="10" height="7.5" rx="1.4" {...LINE} />
      <path d="M1.75 5h10" {...LINE} />
      <rect x="10.25" y="6.75" width="4" height="6.5" rx="1.1" {...LINE} fill="#fff" />
    </svg>
  );
}

/** The API gateway: one way in, three ways on. */
export function GatewayGlyph({ className }: GlyphProps): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className}>
      <path d="M2 8h4.5" {...LINE} />
      <path d="M6.5 8c2 0 2.5-4 4.5-4h2.5M6.5 8h7M6.5 8c2 0 2.5 4 4.5 4h2.5" {...LINE} />
    </svg>
  );
}

/** A spike: a lightning bolt. */
export function BoltGlyph({ className }: GlyphProps): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className}>
      <path d="M9 1.75 3.75 9h4l-1 5.25L12.25 7h-4z" {...LINE} fill="currentColor" strokeWidth={1.1} />
    </svg>
  );
}

/** The time range: a clock face. */
export function ClockGlyph({ className }: GlyphProps): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className}>
      <circle cx="8" cy="8" r="5.6" {...LINE} />
      <path d="M8 4.9V8l2.1 1.4" {...LINE} />
    </svg>
  );
}

/** Taking a service down: a power symbol. */
export function PowerGlyph({ className }: GlyphProps): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className}>
      <path d="M8 2.5v5" {...LINE} />
      <path d="M4.6 4.6a4.8 4.8 0 1 0 6.8 0" {...LINE} />
    </svg>
  );
}
