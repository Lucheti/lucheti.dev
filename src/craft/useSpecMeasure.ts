"use client";

import { useEffect, useState, type RefObject } from "react";
import { CARD_PADDING, CARD_RADIUS } from "./SpecimenCard";
import type { Rect, SpecMeasure } from "./SpecAnnotator";

const PARTS = ["card", "glyph", "title", "subtitle", "toggle", "action"] as const;

type Part = (typeof PARTS)[number];

function within(element: Element, origin: DOMRect): Rect {
  const box = element.getBoundingClientRect();
  return { x: box.left - origin.left, y: box.top - origin.top, width: box.width, height: box.height };
}

function read(stage: HTMLElement): SpecMeasure | null {
  const origin = stage.getBoundingClientRect();
  const rects: Partial<Record<Part, Rect>> = {};
  for (const part of PARTS) {
    const element = stage.querySelector(`[data-spec="${part}"]`);
    if (element === null) {
      return null;
    }
    rects[part] = within(element, origin);
  }
  const { card, glyph, title, subtitle, toggle, action } = rects;
  if (!card || !glyph || !title || !subtitle || !toggle || !action) {
    return null;
  }
  return {
    stage: { width: origin.width, height: origin.height },
    card,
    glyph,
    title,
    subtitle,
    toggle,
    action,
    padding: CARD_PADDING,
    radius: CARD_RADIUS,
  };
}

/** The live boxes of the card's parts, relative to the stage; null until the first measurement. */
export function useSpecMeasure(stageRef: RefObject<HTMLElement | null>): SpecMeasure | null {
  const [measure, setMeasure] = useState<SpecMeasure | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (stage === null) {
      return undefined;
    }
    const update = (): void => setMeasure(read(stage));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    stage.querySelectorAll("[data-spec]").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [stageRef]);

  return measure;
}
