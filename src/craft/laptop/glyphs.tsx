import type { ReactNode } from "react";
import { LINE, type GlyphProps } from "@/laptop";

/**
 * The task tracker's own line icons, on the laptop kit's 16 px grid in `currentColor`. All decorative: the
 * buttons around them carry the names.
 */

export function ComposeGlyph({ className }: GlyphProps): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className}>
      <path d="M8.5 2.75H4.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h7.5a1.5 1.5 0 0 0 1.5-1.5V7.5" {...LINE} />
      <path d="M12.1 2.4a1.2 1.2 0 0 1 1.7 1.7L8.6 9.3l-2.3.6.6-2.3z" {...LINE} />
    </svg>
  );
}

/** "My tasks": a person. */
export function PersonGlyph({ className }: GlyphProps): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className}>
      <circle cx="8" cy="5.6" r="2.6" {...LINE} />
      <path d="M3 13.2c.7-2.3 2.7-3.6 5-3.6s4.3 1.3 5 3.6" {...LINE} />
    </svg>
  );
}

/** "All tasks": a stack of rows. */
export function StackGlyph({ className }: GlyphProps): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className}>
      <path d="M8 2.5 13.5 5.25 8 8 2.5 5.25z" {...LINE} />
      <path d="M2.5 8.1 8 10.85l5.5-2.75" {...LINE} />
      <path d="M2.5 10.95 8 13.7l5.5-2.75" {...LINE} />
    </svg>
  );
}

/** "Completed": a ticked circle. */
export function DoneGlyph({ className }: GlyphProps): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className}>
      <circle cx="8" cy="8" r="5.6" {...LINE} />
      <path d="m5.6 8.1 1.7 1.7 3.2-3.4" {...LINE} />
    </svg>
  );
}

export function CheckGlyph({ className }: GlyphProps): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className}>
      <path d="m3.8 8.3 2.7 2.7 5.7-6" {...LINE} strokeWidth={1.6} />
    </svg>
  );
}

export function AssignGlyph({ className }: GlyphProps): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className}>
      <circle cx="6.5" cy="5.6" r="2.5" {...LINE} />
      <path d="M2 13c.6-2.2 2.4-3.4 4.5-3.4 1 0 1.9.3 2.6.8" {...LINE} />
      <path d="M12.25 9.5v4M10.25 11.5h4" {...LINE} />
    </svg>
  );
}

/** Reopen: an arrow turning back. */
export function UndoGlyph({ className }: GlyphProps): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className}>
      <path d="M5.5 4 3 6.5 5.5 9" {...LINE} />
      <path d="M3.25 6.5h6.25a3.25 3.25 0 0 1 0 6.5H7" {...LINE} />
    </svg>
  );
}
