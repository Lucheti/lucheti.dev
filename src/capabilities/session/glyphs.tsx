import type { ReactNode } from "react";
import { LINE, type GlyphProps } from "@/laptop";

/**
 * The agent window's line icons, on the same 16 px grid and stroke as the other apps' icons, in
 * `currentColor`. All decorative: the rows and buttons around them carry the words.
 */

/** A page with a folded corner: reading a file. */
export function FileGlyph({ className }: GlyphProps): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className}>
      <path d="M4 2.2h5l3 3v8.6H4z" {...LINE} />
      <path d="M9 2.2v3h3M6 8.6h4M6 11h3" {...LINE} />
    </svg>
  );
}

/** A pencil: an edit. */
export function PencilGlyph({ className }: GlyphProps): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className}>
      <path d="M10.6 2.9 13.1 5.4 6 12.5l-3.2.7.7-3.2z" {...LINE} />
      <path d="M9.2 4.3l2.5 2.5" {...LINE} />
    </svg>
  );
}

/** A flask: the tests. */
export function FlaskGlyph({ className }: GlyphProps): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className}>
      <path d="M6.2 2.2h3.6M6.8 2.2v4L3.2 12.4c-.5.8.1 1.6 1 1.6h7.6c.9 0 1.5-.8 1-1.6L9.2 6.2v-4" {...LINE} />
      <path d="M4.9 10h6.2" {...LINE} />
    </svg>
  );
}

/** A tick. */
export function CheckGlyph({ className }: GlyphProps): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className}>
      <path d="m3.6 8.4 2.9 2.8 5.9-6.2" {...LINE} strokeWidth={1.8} />
    </svg>
  );
}

/** A cross. */
export function CrossGlyph({ className }: GlyphProps): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className}>
      <path d="m4.8 4.8 6.4 6.4M11.2 4.8l-6.4 6.4" {...LINE} strokeWidth={1.8} />
    </svg>
  );
}

/** Two branches joining: a pull request. */
export function PullRequestGlyph({ className }: GlyphProps): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className}>
      <circle cx="4.5" cy="3.8" r="1.6" {...LINE} />
      <circle cx="4.5" cy="12.2" r="1.6" {...LINE} />
      <circle cx="11.5" cy="12.2" r="1.6" {...LINE} />
      <path d="M4.5 5.4v5.2M11.5 10.6V6.4c0-1-.8-1.8-1.8-1.8H7.4" {...LINE} />
      <path d="m8.8 3.2-1.4 1.4 1.4 1.4" {...LINE} />
    </svg>
  );
}

/** A small chip: the model. */
export function ModelGlyph({ className }: GlyphProps): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className}>
      <rect x="4" y="4" width="8" height="8" rx="1.8" {...LINE} />
      <path d="M6.5 2v2M9.5 2v2M6.5 12v2M9.5 12v2M2 6.5h2M2 9.5h2M12 6.5h2M12 9.5h2" {...LINE} />
    </svg>
  );
}

/** A speech bubble: a conversation, as the sidebar lists them. */
export function BubbleGlyph({ className }: GlyphProps): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className}>
      <path d="M3 4.2c0-.9.7-1.6 1.6-1.6h6.8c.9 0 1.6.7 1.6 1.6v5c0 .9-.7 1.6-1.6 1.6H7.2L4.4 13v-2.2h0C3.6 10.8 3 10.1 3 9.2z" {...LINE} />
    </svg>
  );
}
