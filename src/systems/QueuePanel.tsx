"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import type { QueuePanel as QueuePanelContent } from "@/content";
import { cx, FeaturePanel } from "@/ui";
import type { QueueToy } from "./queue";
import type { ElementRef } from "./queue/FlightPainter";
import { Producer, Queue } from "./QueueNodes";
import { ServiceRow } from "./ServiceRow";

type FlightLayerProps = Readonly<{ stage: ElementRef; dots: readonly ElementRef[] }>;

/** The pool of dots that carry messages between the nodes; React renders it once, the painter moves it. */
function FlightLayer({ stage, dots }: FlightLayerProps): ReactNode {
  return (
    <div ref={stage} aria-hidden className="pointer-events-none absolute inset-0">
      {dots.map((dot, index) => (
        <span
          key={index}
          ref={dot}
          className="absolute left-0 top-0 -ml-[5px] -mt-[5px] size-2.5 rounded-full bg-signal opacity-0 shadow-[0_0_0_3px_rgb(255_90_31/0.18)] will-change-transform data-[returning=true]:bg-white data-[returning=true]:ring-2 data-[returning=true]:ring-inset data-[returning=true]:ring-signal"
        />
      ))}
    </div>
  );
}

/** A hairline between two nodes. */
function Wire({ className }: Readonly<{ className?: string }>): ReactNode {
  return <span aria-hidden className={cx("h-px shrink-0 bg-line-strong", className)} />;
}

/** A footer counter. */
function Stat({ label, value }: Readonly<{ label: string; value: number }>): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[11px] leading-none text-mute">{label}</dt>
      <dd className="font-dot text-xl font-bold leading-none tabular-nums">{value}</dd>
    </div>
  );
}

type QueuePanelProps = Readonly<{
  panel: QueuePanelContent;
  /** The running toy, shared with the 3D diorama; whoever holds it starts and stops its loop. */
  toy: QueueToy;
  /** Whether this board draws the messages in the air (off while the diorama is drawing them). */
  flights: boolean;
  /** The send button was pressed. */
  onSend: () => void;
  className?: string;
}>;

/**
 * The back end's 2D feature panel, a toy message queue: Checkout publishes a steady flow to a NATS queue,
 * which deals each message to the least busy of three services. "Send" floods it; an overloaded service
 * goes down, hands its messages back, restarts and drains the backlog. It draws the toy it is given; the
 * stage around it runs the loop and speaks the announcements.
 */
export function QueuePanel({ panel, toy, flights, onSend, className }: QueuePanelProps): ReactNode {
  const snapshot = useSyncExternalStore(toy.loop.subscribe, toy.loop.view, toy.loop.view);
  const { painter, slots } = toy;

  return (
    <FeaturePanel label={panel.label} title={panel.title} className={className}>
      <div className="flex flex-1 flex-col gap-5">
        <div className="relative flex flex-1 flex-col justify-center gap-4 sm:flex-row sm:items-center sm:gap-0">
          <div className="flex min-w-0 items-center sm:flex-1">
            <Producer producer={panel.producer} anchor={painter.bindAnchor("producer")} />
            <Wire className="w-3 sm:w-4" />
            <Queue
              broker={panel.broker}
              queued={snapshot.queued}
              label={panel.readout.queued}
              tailAnchor={painter.bindAnchor("queue-in")}
              headAnchor={painter.bindAnchor("queue-out")}
            />
          </div>
          <Wire className="hidden w-4 sm:block" />
          <ul className="flex min-w-0 flex-col gap-1.5 sm:w-[13rem] sm:shrink-0">
            {panel.services.map((service, index) => {
              const view = snapshot.services[index];
              return (
                <ServiceRow
                  key={service.name}
                  name={service.name}
                  tool={service.tool}
                  kind={view.status.kind}
                  since={view.status.kind === "healthy" ? 0 : view.status.since}
                  held={view.held}
                  incoming={view.incoming}
                  processed={view.processed}
                  limit={slots.limit}
                  capacity={slots.capacity}
                  overloadMs={toy.overloadMs}
                  statuses={panel.statuses}
                  readout={panel.readout}
                  anchor={painter.bindAnchor(`service-${index}`)}
                />
              );
            })}
          </ul>
          {flights ? <FlightLayer stage={painter.bindStage} dots={painter.dotBindings()} /> : null}
        </div>

        <div className="flex flex-col gap-4 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onSend}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-signal px-4 text-sm font-semibold text-ink shadow-[0_10px_24px_-12px_rgb(255_90_31/0.9)] transition-[transform,filter] duration-150 ease-out hover:brightness-105 active:scale-[0.97] motion-reduce:transition-none"
          >
            <svg aria-hidden viewBox="0 0 16 16" className="size-4">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
            {panel.send.label}
          </button>
          <dl className="grid grid-cols-3 gap-4 sm:flex sm:gap-6">
            <Stat label={panel.readout.queued} value={snapshot.queued.length} />
            <Stat label={panel.readout.processed} value={snapshot.totals.processed} />
            <Stat label={panel.readout.restarts} value={snapshot.totals.restarts} />
          </dl>
        </div>
      </div>
    </FeaturePanel>
  );
}
