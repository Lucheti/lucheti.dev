"use client";

import type { CSSProperties, ReactNode, Ref, RefObject } from "react";
import type { Corner } from "./corner";
import { DeviceFrame } from "./DeviceFrame";
import { GhostCursor, Screen } from "./GhostCursor";
import type { Point } from "./GhostScript";
import { MenuBar } from "./MenuBar";
import type { MenuClock } from "./MenuClock";
import { Wallpaper } from "./Wallpaper";

/**
 * The panel is drawn on a fixed 700 × 530 stage and scaled to its column with CSS alone (the ratio of the
 * column's width to the stage's), so the crop is the same at every width and the server's first paint is right.
 */
const STAGE_SCALE: CSSProperties = { scale: "tan(atan2(100cqw, 700px))" };

/** The crop cuts cleanly at the sides, where the laptop runs on, and fades into the page at the bottom. */
const CROP_FADE: CSSProperties = {
  maskImage: "linear-gradient(to bottom, #000 74%, transparent 100%)",
};

/** The ghost's side of the visitor's pointer: it steps aside when the pointer comes in. */
export interface GhostSeat {
  enter(): void;
  /** The pointer left at `now`, on the animation frames' clock. */
  leave(now: number): void;
}

/** Where the ghost cursor is drawn: the screen it measures from, and the cursor itself. */
export type ScreenBindings = Readonly<{ bindScreen: Ref<HTMLDivElement>; bindCursor: Ref<HTMLDivElement> }>;

type LaptopStageProps = Readonly<{
  corner: Corner;
  /** What the panel shows, for screen readers. */
  label: string;
  /** The menu bar: the app's name, its menus and the clock. */
  menu: Readonly<{ app: string; menus: readonly string[]; clock: MenuClock }>;
  boxRef: RefObject<HTMLDivElement | null>;
  ghost: GhostSeat;
  screen: ScreenBindings;
  /** Where the ghost cursor rests between moves, on the screen. */
  rest: Point;
  /** The app window. */
  children: ReactNode;
}>;

/**
 * A close crop of one corner of a laptop's display, seen straight on, with an app open on a warm desktop.
 * The box is pulled up so the device's top edge is level with the heading beside it: the device sits 46 px
 * down a 700 px-wide stage, so the box rises by that share of its width.
 */
export function LaptopStage({ corner, label, menu, boxRef, ghost, screen, rest, children }: LaptopStageProps): ReactNode {
  return (
    <figure className="relative lg:-mt-[6.57%]">
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
            <DeviceFrame corner={corner}>
              <Screen bind={screen.bindScreen}>
                <Wallpaper corner={corner} />
                <MenuBar corner={corner} app={menu.app} menus={menu.menus} clock={menu.clock} />
                {children}
                <span aria-hidden data-ghost="rest" className="absolute size-px" style={{ left: rest.x, top: rest.y }} />
                <GhostCursor bind={screen.bindCursor} />
              </Screen>
            </DeviceFrame>
          </div>
        </div>
      </div>
    </figure>
  );
}
