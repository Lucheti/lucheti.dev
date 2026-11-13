"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { DepartmentId } from "@/content";
import type { Progress, Signal } from "@/story";
import { cx } from "@/ui";
import { BoardGeometry, type Box } from "./BoardGeometry";
import { BoardReadout } from "./BoardReadout";
import { DepartmentCard } from "./DepartmentCard";
import type { BoardState, ChannelStatus, LifecycleScript } from "./LifecycleScript";
import { PacketTrack } from "./PacketTrack";
import type { Point } from "./Polyline";
import type { Roster } from "./Roster";
import { TicketPacket } from "./TicketPacket";

type DepartmentBoardProps = Readonly<{
  roster: Roster;
  script: LifecycleScript;
  state: BoardState;
  progress: Signal<Progress>;
}>;

type BoardLayout = Readonly<{
  geometry: BoardGeometry;
  track: PacketTrack;
  width: number;
  height: number;
}>;

const BOARD_LABEL = "Department board";

/**
 * A loop around the board: product, engineering and design across the top,
 * QA and docs down the right, release and learning back along the bottom.
 * Every handoff in the lifecycle is between neighbours, so every channel is a
 * short straight hairline across one gutter. Engineering, the biggest roster,
 * spans two rows in the middle; the free cell beside it holds the readout.
 */
const PLACEMENT: Readonly<Record<DepartmentId, string>> = {
  product: "col-start-1 row-start-1",
  engineering: "col-start-2 row-start-1 row-span-2",
  design: "col-start-3 row-start-1",
  qa: "col-start-3 row-start-2",
  docs: "col-start-3 row-start-3",
  release: "col-start-2 row-start-3",
  learning: "col-start-1 row-start-3",
};
const READOUT_PLACEMENT = "col-start-1 row-start-2";

const CHANNEL_STROKE: Readonly<Record<ChannelStatus, string>> = {
  unused: "stroke-fog/20",
  used: "stroke-fog/45",
  carrying: "stroke-signal",
};
const PORT_SIZE = 5;

function svgPoints(points: readonly Point[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

/** The lg+ board: seven department cards, the channels between them and the ticket packet. */
export function DepartmentBoard({ roster, script, state, progress }: DepartmentBoardProps): ReactNode {
  const boardRef = useRef<HTMLDivElement>(null);
  const cards = useRef(new Map<DepartmentId, HTMLDivElement>());
  const [layout, setLayout] = useState<BoardLayout | null>(null);

  useEffect(() => {
    const board = boardRef.current;
    if (board === null) {
      return undefined;
    }
    const observer = new ResizeObserver(() => {
      // Hidden below lg: keep the last layout rather than measure zeros.
      if (board.offsetWidth === 0) {
        return;
      }
      const boxes = new Map<DepartmentId, Box>();
      cards.current.forEach((card, id) => {
        boxes.set(id, { x: card.offsetLeft, y: card.offsetTop, width: card.offsetWidth, height: card.offsetHeight });
      });
      const geometry = new BoardGeometry(boxes);
      setLayout({
        geometry,
        track: new PacketTrack(script, geometry),
        width: board.offsetWidth,
        height: board.offsetHeight,
      });
    });
    observer.observe(board);
    return () => observer.disconnect();
  }, [script]);

  const register =
    (id: DepartmentId) =>
    (card: HTMLDivElement | null): void => {
      if (card === null) {
        cards.current.delete(id);
      } else {
        cards.current.set(id, card);
      }
    };

  const ticket = script.ticketIn(state.phase);

  return (
    <div
      ref={boardRef}
      role="list"
      aria-label={BOARD_LABEL}
      className="relative grid grid-cols-3 gap-x-7 gap-y-6 [--row:clamp(1.25rem,2.4dvh,1.625rem)] xl:gap-x-10"
    >
      {layout !== null && (
        <svg
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-10 overflow-visible"
          width={layout.width}
          height={layout.height}
        >
          {script.channels().map((channel) => {
            const points = layout.geometry.channel(channel.from, channel.to);
            const stroke = CHANNEL_STROKE[state.channels.get(channel.key) ?? "unused"];
            const ends = [points[0], points[points.length - 1]];
            return (
              <g key={channel.key} className={cx("transition-[stroke] duration-300", stroke)}>
                <polyline points={svgPoints(points)} fill="none" strokeWidth={1} />
                {ends.map((end) => (
                  <rect
                    key={`${end.x},${end.y}`}
                    x={end.x - PORT_SIZE / 2}
                    y={end.y - PORT_SIZE / 2}
                    width={PORT_SIZE}
                    height={PORT_SIZE}
                    className="fill-graphite"
                    strokeWidth={1}
                  />
                ))}
              </g>
            );
          })}
        </svg>
      )}

      {roster.departmentIds().map((id) => {
        const department = state.departments.get(id);
        return department === undefined ? null : (
          <DepartmentCard
            key={id}
            id={id}
            roster={roster}
            state={department}
            className={PLACEMENT[id]}
            cardRef={register(id)}
          />
        );
      })}

      <BoardReadout
        phase={state.phase}
        ticket={ticket}
        stepCount={script.stepCount()}
        className={READOUT_PLACEMENT}
      />

      {layout !== null && (
        <TicketPacket track={layout.track} progress={progress} ticket={ticket} shown={state.phase.kind !== "waiting"} />
      )}
    </div>
  );
}
