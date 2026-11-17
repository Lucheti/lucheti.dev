import type { ReactNode } from "react";
import type { BlockKind } from "@/content";
import { assertNever } from "./assertNever";

/** The strokes of a block kind's glyph, on a 16 px grid. */
function strokes(kind: BlockKind): ReactNode {
  switch (kind) {
    case "avatar":
      return (
        <>
          <circle cx="8" cy="6" r="2.6" />
          <path d="M3.2 13.4c.8-2.4 2.6-3.6 4.8-3.6s4 1.2 4.8 3.6" />
        </>
      );
    case "title":
      return <path d="M3.5 3.5h9M8 3.5v9" />;
    case "text":
      return <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h7" />;
    case "image":
      return (
        <>
          <rect x="2" y="3" width="12" height="10" rx="2" />
          <path d="m2.5 11.5 3.2-3.2 2.3 2.3 1.6-1.6 3.4 3.4" />
          <circle cx="10.6" cy="6" r="1" />
        </>
      );
    case "button":
      return (
        <>
          <rect x="1.5" y="4.5" width="13" height="7" rx="3.5" />
          <path d="M5.5 8h5" />
        </>
      );
    case "toggle":
      return (
        <>
          <rect x="1.5" y="4.5" width="13" height="7" rx="3.5" />
          <circle cx="11" cy="8" r="1.8" fill="currentColor" stroke="none" />
        </>
      );
    case "badge":
      return (
        <>
          <path d="M2.5 8.6V3.9c0-.8.6-1.4 1.4-1.4h4.7l5 5c.5.5.5 1.4 0 1.9l-3.3 3.3c-.5.5-1.4.5-1.9 0z" />
          <circle cx="5.4" cy="5.4" r="0.9" fill="currentColor" stroke="none" />
        </>
      );
    case "rating":
      return <path d="m8 2.4 1.7 3.5 3.8.5-2.8 2.7.7 3.8L8 11.1l-3.4 1.8.7-3.8-2.8-2.7 3.8-.5z" strokeLinejoin="round" />;
    default:
      return assertNever(kind);
  }
}

/** A block kind as a small line drawing, for its shelf chip. Decorative: the chip says the name. */
export function BlockGlyph({ kind, className }: Readonly<{ kind: BlockKind; className?: string }>): ReactNode {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {strokes(kind)}
    </svg>
  );
}
