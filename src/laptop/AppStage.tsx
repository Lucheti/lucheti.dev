"use client";

import type { CSSProperties, ReactNode, Ref, RefObject } from "react";
import { GhostCursor, Screen } from "./GhostCursor";
import type { Point } from "./GhostScript";

/**
 * The panel is drawn on a fixed 700 × 530 stage and scaled to its column with CSS alone (the ratio of the
 * column's width to the stage's), so the crop is the same at every width and the server's first paint is right.
 */
const STAGE_SCALE: CSSProperties = { scale: "tan(atan2(100cqw, 700px))" };

/** The crop cuts cleanly at the side, where the window runs on, and fades into the page at the bottom. */
const CROP_FADE: CSSProperties = {
  maskImage: "linear-gradient(to bottom, #000 74%, transparent 100%)",
};

/** The ghost's side of the visitor's pointer: it steps aside when the pointer comes in. */
export interface GhostSeat {
  enter(): void;
  /** The pointer left at `now`, on the animation frames' clock. */
  leave(now: number): void;
}

/** Where the ghost cursor is drawn: the surface it measures from, and the cursor itself. */
export type ScreenBindings = Readonly<{ bindScreen: Ref<HTMLDivElement>; bindCursor: Ref<HTMLDivElement> }>;

type AppStageProps = Readonly<{
  /** What the panel shows, for screen readers. */
  label: string;
  boxRef: RefObject<HTMLDivElement | null>;
  ghost: GhostSeat;
  screen: ScreenBindings;
  /** Where the ghost cursor rests between moves, on the stage. */
  rest: Point;
  /** The app window. */
  children: ReactNode;
}>;

/**
 * An app window on its own, with no device around it: its top edge level with the heading beside it, its
 * corner in view, and the rest running off the crop at the side and fading out at the bottom.
 */
export function AppStage({ label, boxRef, ghost, screen, rest, children }: AppStageProps): ReactNode {
  return (
    <figure className="relative">
      <figcaption className="sr-only">{label}</figcaption>
      <div
        ref={boxRef}
        onPointerEnter={() => ghost.enter()}
        onPointerLeave={() => ghost.leave(performance.now())}
        onFocus={() => ghost.enter()}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            ghost.leave(performance.now());
          }
        }}
        className="relative aspect-[700/530] w-full [container-type:inline-size]"
      >
        <div className="absolute inset-0 overflow-hidden" style={CROP_FADE}>
          <div className="absolute left-0 top-0 h-[530px] w-[700px] origin-top-left" style={STAGE_SCALE}>
            <Screen bind={screen.bindScreen}>
              {children}
              <span aria-hidden data-ghost="rest" className="absolute size-px" style={{ left: rest.x, top: rest.y }} />
              <GhostCursor bind={screen.bindCursor} />
            </Screen>
          </div>
        </div>
      </div>
    </figure>
  );
}
