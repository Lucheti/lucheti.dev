"use client";

import type { CSSProperties, ReactNode, Ref, RefObject } from "react";
import { assertNever } from "./assertNever";
import type { Corner } from "./corner";
import { GhostCursor, Screen } from "./GhostCursor";
import type { Point } from "./GhostScript";

/** The stage every window is drawn on, in its own pixels; it is scaled to the column. */
const STAGE = { width: 600, height: 510 } as const;

/** Every app window is this tall: it ends with its own rounded corners inside the stage, with room for its shadow. */
export const WINDOW_HEIGHT = 460;

/**
 * The stage is scaled to its column with CSS alone (the ratio of the column's width to the stage's), so the
 * crop is the same at every width and the server's first paint is right.
 */
const STAGE_SCALE: CSSProperties = { scale: `tan(atan2(100cqw, ${STAGE.width}px))` };

/** How far the window's shadow may spill past the box on the sides that are not cut. */
const SPILL = "80px";

/**
 * The crop cuts only the side where the window runs on, at the stage line; everywhere else the window's
 * rounded corners and shadow show whole.
 */
function cropFor(corner: Corner): CSSProperties {
  switch (corner.kind) {
    case "top-left":
      return { clipPath: `inset(-${SPILL} 0 -${SPILL} -${SPILL})` };
    case "top-right":
      return { clipPath: `inset(-${SPILL} -${SPILL} -${SPILL} 0)` };
    default:
      return assertNever(corner);
  }
}

/** The ghost's side of the visitor's pointer: it steps aside when the pointer comes in. */
export interface GhostSeat {
  enter(): void;
  /** The pointer left at `now`, on the animation frames' clock. */
  leave(now: number): void;
}

/** Where the ghost cursor is drawn: the surface it measures from, and the cursor itself. */
export type ScreenBindings = Readonly<{ bindScreen: Ref<HTMLDivElement>; bindCursor: Ref<HTMLDivElement> }>;

type AppStageProps = Readonly<{
  /** Which corner of the window is in view; the window runs off the other side. */
  corner: Corner;
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
 * corner and bottom edge in view, and the rest running off the crop at the stage line.
 */
export function AppStage({ corner, label, boxRef, ghost, screen, rest, children }: AppStageProps): ReactNode {
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
        className="relative w-full [container-type:inline-size]"
        style={{ aspectRatio: `${STAGE.width} / ${STAGE.height}` }}
      >
        <div className="absolute inset-0" style={cropFor(corner)}>
          <div className="absolute left-0 top-0 origin-top-left" style={{ ...STAGE_SCALE, width: STAGE.width, height: STAGE.height }}>
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
