import type { ReactNode } from "react";

/**
 * The laptop's system glyphs (the menu bar's and the pointer) and the line icons every app on its screen
 * shares, drawn on a 16 px grid in `currentColor`. All decorative: the buttons around them carry the names.
 */
export type GlyphProps = Readonly<{ className?: string }>;

/** The stroke every line icon is drawn with. */
export const LINE = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** The generic apple glyph at the left of the menu bar. */
export function AppleGlyph({ className }: GlyphProps): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

/** Battery, nearly full. */
export function BatteryGlyph({ className }: GlyphProps): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 27 13" className={className}>
      <rect x="0.5" y="0.5" width="23" height="12" rx="3.6" fill="none" stroke="currentColor" strokeOpacity="0.45" />
      <rect x="2" y="2" width="17" height="9" rx="2.2" fill="currentColor" />
      <path d="M25 4.5v4c.8-.3 1.4-1.1 1.4-2s-.6-1.7-1.4-2z" fill="currentColor" fillOpacity="0.45" />
    </svg>
  );
}

/** Wi-Fi, full signal. */
export function WifiGlyph({ className }: GlyphProps): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 16 12" className={className} fill="currentColor">
      <path d="M8 2.2c2.3 0 4.4.9 6 2.4.2.2.5.2.7 0l.9-.9c.2-.2.2-.5 0-.7C13.6 1.1 10.9 0 8 0S2.4 1.1.4 3c-.2.2-.2.5 0 .7l.9.9c.2.2.5.2.7 0 1.6-1.5 3.7-2.4 6-2.4z" />
      <path d="M8 5.6c1.4 0 2.6.5 3.6 1.4.2.2.5.2.7 0l.9-.9c.2-.2.2-.5 0-.7C11.8 4.1 10 3.4 8 3.4S4.2 4.1 2.8 5.4c-.2.2-.2.5 0 .7l.9.9c.2.2.5.2.7 0 1-.9 2.2-1.4 3.6-1.4z" />
      <path d="M8 9c.5 0 1 .2 1.3.5.2.2.5.2.7 0l.9-.9c.2-.2.2-.5 0-.7C10.1 7.2 9.1 6.8 8 6.8s-2.1.4-2.9 1.1c-.2.2-.2.5 0 .7l.9.9c.2.2.5.2.7 0C7 9.2 7.5 9 8 9z" />
      <circle cx="8" cy="10.9" r="1.1" />
    </svg>
  );
}

/** Two stacked toggles, like the control centre's icon. */
export function ControlsGlyph({ className }: GlyphProps): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 16 14" className={className}>
      <rect x="0.75" y="0.75" width="14.5" height="5.5" rx="2.75" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="12.5" cy="3.5" r="1.6" fill="currentColor" />
      <rect x="0.75" y="7.75" width="14.5" height="5.5" rx="2.75" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="3.5" cy="10.5" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function SearchGlyph({ className }: GlyphProps): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className}>
      <circle cx="7" cy="7" r="4.6" {...LINE} />
      <path d="M10.4 10.4 13.6 13.6" {...LINE} />
    </svg>
  );
}

export function ChevronDownGlyph({ className }: GlyphProps): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className}>
      <path d="M5 6.5 8 9.5l3-3" {...LINE} />
    </svg>
  );
}

export function ChevronRightGlyph({ className }: GlyphProps): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className}>
      <path d="M6.5 5 9.5 8l-3 3" {...LINE} />
    </svg>
  );
}

/** The macOS arrow pointer, tip at the top left of its box. */
export function ArrowPointer({ className }: GlyphProps): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 20 28" className={className}>
      <path
        d="M1.5 1.5v20.3l4.9-4.6 3.1 7.3c.2.5.8.7 1.3.5l2.3-1c.5-.2.7-.8.5-1.3l-3-7.1h6.9z"
        fill="#000"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
