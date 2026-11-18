import type { ReactNode, Ref } from "react";
import { ArrowPointer } from "./glyphs";

/**
 * The idle ghost's macOS arrow. React draws it once, hidden; the director moves it, fades it in and out
 * (`data-visible`) and presses it (`data-pressed`) straight on the element, every frame.
 */
export function GhostCursor({ bind }: Readonly<{ bind: Ref<HTMLDivElement> }>): ReactNode {
  return (
    <div
      ref={bind}
      aria-hidden
      data-visible="false"
      className="pointer-events-none absolute left-0 top-0 z-50 opacity-0 transition-opacity duration-500 will-change-transform data-[visible=true]:opacity-100"
    >
      <ArrowPointer className="-ml-[2px] -mt-[2px] h-[26px] w-[19px] origin-top-left drop-shadow-[0_2px_3px_rgb(0_0_0/0.28)] transition-transform duration-100 in-data-[pressed=true]:scale-[0.86]" />
    </div>
  );
}

/** The surface the app window sits on and the ghost measures from: the whole stage, with no frame of its own. */
export function Screen({ bind, children }: Readonly<{ bind: Ref<HTMLDivElement>; children: ReactNode }>): ReactNode {
  return (
    <div ref={bind} className="absolute inset-0">
      {children}
    </div>
  );
}
