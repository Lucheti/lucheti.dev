"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { Progress, Signal } from "@/story";
import { cx } from "@/ui";
import type { PacketTrack } from "./PacketTrack";
import type { PointSlot } from "./Polyline";

type TicketPacketProps = Readonly<{
  track: PacketTrack;
  progress: Signal<Progress>;
  ticket: string;
  shown: boolean;
}>;

/**
 * The orange ticket that travels the board's hairlines. Its position follows
 * scroll through direct transform writes; only its label and visibility are
 * React state, and those change once per step.
 */
export function TicketPacket({ track, progress, ticket, shown }: TicketPacketProps): ReactNode {
  const moverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mover = moverRef.current;
    if (mover === null) {
      return undefined;
    }
    const slot: PointSlot = { x: 0, y: 0 };
    const place = (value: Progress): void => {
      if (track.place(value.toNumber(), slot)) {
        mover.style.transform = `translate3d(${slot.x}px, ${slot.y}px, 0)`;
      }
    };
    place(progress.current());
    return progress.subscribe(place);
  }, [track, progress]);

  return (
    <div ref={moverRef} aria-hidden className="pointer-events-none absolute left-0 top-0 z-20 will-change-transform">
      <div
        className={cx(
          "flex h-4 -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-[2px] bg-signal px-1.5 transition-[opacity,scale] duration-300 ease-out-expo",
          shown ? "scale-100 opacity-100" : "scale-50 opacity-0",
        )}
      >
        <span className="size-1.5 bg-graphite" />
        <span className="whitespace-nowrap font-mono text-[10px] font-medium leading-none text-graphite">{ticket}</span>
      </div>
    </div>
  );
}
