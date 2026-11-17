"use client";

import { useEffect, useState, type RefObject } from "react";
import type { StageKind } from "./StageLayout";

/**
 * Which stage fits the panel: the one-row "wide" stage from `wideFromPx` of inner width, the two-row
 * "compact" one below it. It follows the panel's own width, not the window's, and is "wide" until measured.
 */
export function useStageKind(target: RefObject<Element | null>, wideFromPx: number): StageKind {
  const [kind, setKind] = useState<StageKind>("wide");
  useEffect(() => {
    const element = target.current;
    if (element === null) {
      return undefined;
    }
    const observer = new ResizeObserver(([entry]) => {
      setKind(entry.contentRect.width >= wideFromPx ? "wide" : "compact");
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [target, wideFromPx]);
  return kind;
}
