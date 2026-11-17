"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import type { Laptop } from "@/content";
import { usePanelLoop } from "@/ui";
import { AppWindow } from "./laptop/AppWindow";
import { composeLaptop } from "./laptop/composeLaptop";
import { DeviceFrame } from "./laptop/DeviceFrame";
import { GhostCursor, Screen } from "./laptop/GhostCursor";
import { MenuBar } from "./laptop/MenuBar";
import { Wallpaper } from "./laptop/Wallpaper";

/** Tablet width and up: where the laptop leans toward the pointer. Matches Tailwind's `md`. */
const WIDE_QUERY = "(min-width: 768px)";

function subscribeToWidth(onChange: () => void): () => void {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const isWide = (): boolean => window.matchMedia(WIDE_QUERY).matches;

/**
 * The panel is drawn on a fixed 700 × 530 stage and scaled to its column with CSS alone (the ratio of the
 * column's width to the stage's), so the crop is the same at every width and the server's first paint is right.
 */
const STAGE_SCALE: CSSProperties = { scale: "tan(atan2(100cqw, 700px))" };

/** The crop cuts cleanly on the right, where the laptop runs on, and fades into the page at the bottom. */
const CROP_FADE: CSSProperties = {
  maskImage: "linear-gradient(to bottom, #000 74%, transparent 100%)",
};

/**
 * The Front end chapter's panel: a close crop of a laptop's top-left corner (aluminium rim, black glass
 * bezel, rounded screen corner) with a small task tracker open on a warm desktop. It is real DOM, so the
 * text is crisp and every control works: views, finishing tasks, row actions and a ⌘K palette. While
 * nobody is touching it, a ghost cursor runs through a short loop of real actions, the menu bar clock ticks
 * and now and then a task arrives. It leans a little toward the pointer on wider screens. Under reduced
 * motion it holds still: no ghost, no lean, no arrivals; clicks still work, at once.
 */
export function LaptopPanel({ laptop }: Readonly<{ laptop: Laptop }>): ReactNode {
  const [parts] = useState(() => composeLaptop(laptop));
  const boxRef = useRef<HTMLDivElement>(null);
  const running = usePanelLoop(boxRef);
  const reduced = useReducedMotion() === true;
  const wide = useSyncExternalStore(subscribeToWidth, isWide, () => true);
  const { director, tilt, palette, surface, actions, pose } = parts;
  const [rest] = useState(() => pose.pose());

  useEffect(() => {
    if (running) {
      director.start();
    } else {
      director.stop();
    }
  }, [running, director]);

  useEffect(() => tilt.enable(wide && !reduced), [tilt, wide, reduced]);

  useEffect(
    () => () => {
      director.stop();
      tilt.stop();
      actions.dispose();
    },
    [director, tilt, actions],
  );

  // ⌘K (or Ctrl+K) opens the palette, but only while the visitor is in the panel, so the page keeps its own.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const box = boxRef.current;
      const engaged = box !== null && (box.matches(":hover") || box.contains(document.activeElement));
      if (engaged && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        palette.open("visitor");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [palette]);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.pointerType === "mouse") {
      const box = event.currentTarget.getBoundingClientRect();
      tilt.aim(event.clientX - box.left, event.clientY - box.top, box.width, box.height);
    }
  };

  return (
    <figure className="relative">
      <figcaption className="sr-only">{laptop.label}</figcaption>
      <div
        ref={boxRef}
        onPointerEnter={() => director.enter()}
        onPointerLeave={() => {
          director.leave(performance.now());
          tilt.release();
        }}
        onPointerMove={onPointerMove}
        onFocus={() => director.enter()}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            director.leave(performance.now());
          }
        }}
        className="relative aspect-[700/530] w-full [container-type:inline-size]"
      >
        <div className="absolute inset-0 overflow-hidden" style={CROP_FADE}>
          <div className="absolute left-0 top-0 h-[530px] w-[700px] origin-top-left [perspective:1900px] [perspective-origin:20%_10%]" style={STAGE_SCALE}>
            <DeviceFrame bind={tilt.bind} rest={rest}>
              <Screen bind={surface.bindScreen}>
                <Wallpaper />
                <MenuBar app={laptop.app} menus={laptop.menus} clock={parts.clock} />
                <AppWindow content={laptop} parts={parts} reduced={reduced} />
                <span aria-hidden data-ghost="rest" className="absolute left-[470px] top-[372px] size-px" />
                <GhostCursor bind={surface.bindCursor} />
              </Screen>
            </DeviceFrame>
          </div>
        </div>
      </div>
    </figure>
  );
}
