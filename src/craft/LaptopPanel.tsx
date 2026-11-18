"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Laptop } from "@/content";
import { usePanelLoop } from "@/ui";
import { AppWindow } from "./laptop/AppWindow";
import { composeLaptop } from "./laptop/composeLaptop";
import { DeviceFrame } from "./laptop/DeviceFrame";
import { GhostCursor, Screen } from "./laptop/GhostCursor";
import { MenuBar } from "./laptop/MenuBar";
import { Wallpaper } from "./laptop/Wallpaper";

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
 * and now and then a task arrives. The device is seen straight on, square to the page. Under reduced
 * motion it holds still: no ghost, no arrivals; clicks still work, at once.
 */
export function LaptopPanel({ laptop }: Readonly<{ laptop: Laptop }>): ReactNode {
  const [parts] = useState(() => composeLaptop(laptop));
  const boxRef = useRef<HTMLDivElement>(null);
  const running = usePanelLoop(boxRef);
  const reduced = useReducedMotion() === true;
  const { director, palette, surface, actions } = parts;

  useEffect(() => {
    if (running) {
      director.start();
    } else {
      director.stop();
    }
  }, [running, director]);

  useEffect(
    () => () => {
      director.stop();
      actions.dispose();
    },
    [director, actions],
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

  return (
    // The device sits 46 px down a 700 px-wide stage; pulling the box up by that share of its width puts the
    // laptop's top edge level with the heading beside it.
    <figure className="relative lg:-mt-[6.57%]">
      <figcaption className="sr-only">{laptop.label}</figcaption>
      <div
        ref={boxRef}
        onPointerEnter={() => director.enter()}
        onPointerLeave={() => director.leave(performance.now())}
        onFocus={() => director.enter()}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            director.leave(performance.now());
          }
        }}
        className="relative aspect-[700/530] w-full [container-type:inline-size]"
      >
        <div className="absolute inset-0 overflow-hidden" style={CROP_FADE}>
          <div className="absolute left-0 top-0 h-[530px] w-[700px] origin-top-left" style={STAGE_SCALE}>
            <DeviceFrame>
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
