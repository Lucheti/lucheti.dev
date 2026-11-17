"use client";

import { useEffect } from "react";

/** Frames to wait so the pinned chapters have measured themselves and grown to their real height. */
const SETTLE_FRAMES = 3;

/**
 * Lands a link with a hash (e.g. `/#ai`) on its chapter. The browser jumps to the anchor before the pinned
 * chapters above it reach their full scroll height, so the first jump falls short; once layout has
 * settled this scrolls to the target again, instantly.
 */
export function HashLanding(): null {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id.length === 0) {
      return undefined;
    }
    let frame = 0;
    let waited = 0;
    const land = (): void => {
      waited += 1;
      if (waited < SETTLE_FRAMES) {
        frame = requestAnimationFrame(land);
        return;
      }
      document.getElementById(id)?.scrollIntoView({ behavior: "instant", block: "start" });
    };
    void document.fonts.ready.then(() => {
      frame = requestAnimationFrame(land);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  return null;
}
