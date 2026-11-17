"use client";

import { useEffect, useState, type RefObject } from "react";
import type { StageSize } from "./StageFit";

/** The element's content size in CSS pixels, kept current as it resizes; null until it has been measured. */
export function useStageSize(target: RefObject<HTMLElement | null>): StageSize | null {
  const [size, setSize] = useState<StageSize | null>(null);

  useEffect(() => {
    const element = target.current;
    if (element === null) {
      return undefined;
    }
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      if (width > 0 && height > 0) {
        setSize((last) => (last !== null && last.width === width && last.height === height ? last : { width, height }));
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [target]);

  return size;
}
