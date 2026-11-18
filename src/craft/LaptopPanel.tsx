"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Laptop } from "@/content";
import { LaptopStage, type Corner } from "@/laptop";
import { usePanelLoop } from "@/ui";
import { AppWindow } from "./laptop/AppWindow";
import { composeLaptop } from "./laptop/composeLaptop";

const CORNER: Corner = { kind: "top-left" };
/** Where the ghost rests between moves: low in the list, clear of the rows it works on. */
const REST = { x: 470, y: 372 } as const;

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
  const { director, loop, palette, surface, actions } = parts;

  useEffect(() => {
    if (running) {
      loop.start();
    } else {
      loop.stop();
    }
  }, [running, loop]);

  useEffect(
    () => () => {
      loop.stop();
      actions.dispose();
    },
    [loop, actions],
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
    <LaptopStage
      corner={CORNER}
      desktop="white"
      label={laptop.label}
      menu={{ app: laptop.app, menus: laptop.menus, clock: parts.clock }}
      boxRef={boxRef}
      ghost={director}
      screen={surface}
      rest={REST}
    >
      <AppWindow content={laptop} parts={parts} reduced={reduced} />
    </LaptopStage>
  );
}
