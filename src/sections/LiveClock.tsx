"use client";

import { useMemo, useSyncExternalStore, type ReactNode } from "react";
import { ZonedClock } from "./ZonedClock";

const TICK_MS = 30_000;

function subscribeToTicks(onTick: () => void): () => void {
  const id = window.setInterval(onTick, TICK_MS);
  return () => window.clearInterval(id);
}

function placeholder(): string {
  return ZonedClock.PLACEHOLDER;
}

/**
 * The server and the first client render both use the placeholder; the real
 * time arrives right after hydration, so the markup never mismatches.
 */
function useZonedTime(timeZone: string): string {
  const clock = useMemo(() => new ZonedClock(timeZone), [timeZone]);
  return useSyncExternalStore(subscribeToTicks, () => clock.read(new Date()), placeholder);
}

type LiveClockProps = Readonly<{
  timeZone: string;
  city: string;
  className?: string;
}>;

/** "Buenos Aires 19:56", ticking every 30 seconds. */
export function LiveClock({ timeZone, city, className }: LiveClockProps): ReactNode {
  const time = useZonedTime(timeZone);
  return (
    <span className={className}>
      {city} <time className="tabular-nums">{time}</time>
    </span>
  );
}
