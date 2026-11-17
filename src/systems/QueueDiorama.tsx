"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type PointerEvent, type ReactNode } from "react";
import type { QueuePanel as QueuePanelContent } from "@/content";
import { cx, SceneBoundary, usePanelLoop } from "@/ui";
import { composeQueueDiorama, type QueueDioramaParts } from "./diorama/composeQueueDiorama";
import { behaviourOf, pickMode, type DioramaBehaviour } from "./diorama/kit";
import { QueueLabels } from "./diorama/QueueLabels";
import { assertNever } from "./queue/assertNever";
import type { QueueToy } from "./queue";
import { QueuePanel } from "./QueuePanel";

// WebGL has no server render; three.js and the scene are fetched only in the browser.
const QueueScene = dynamic(() => import("./diorama/QueueScene"), { ssr: false });

/** Tablet width and up: where the island leans and drags. Matches Tailwind's `md`. */
const WIDE_QUERY = "(min-width: 768px)";

/** Where the WebGL scene stands: loading behind the 2D board, drawing, or given up on. */
type SceneStatus = "loading" | "ready" | "failed";

function subscribeToWidth(onChange: () => void): () => void {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const isWide = (): boolean => window.matchMedia(WIDE_QUERY).matches;

/** The latest sentence about the queue for the live region: a service going down, restarting, coming back. */
function useAnnouncement(toy: QueueToy): string {
  const [announcement, setAnnouncement] = useState("");
  useEffect(
    () =>
      toy.loop.listen((events) => {
        const sentence = toy.announcer.describe(events);
        if (sentence !== null) {
          setAnnouncement(sentence);
        }
      }),
    [toy],
  );
  return announcement;
}

/** Runs the toy's steady flow while `running`, and stops it when the stage goes away. */
function useQueueLoop(toy: QueueToy, running: boolean): void {
  useEffect(() => {
    if (!running) {
      return undefined;
    }
    toy.loop.start("ambient");
    return () => toy.loop.stop();
  }, [running, toy]);
  useEffect(() => () => toy.loop.stop(), [toy]);
}

/** The island's box takes the shape of its drawing, so it fills the column with no dead bands. */
function boxAspect(parts: QueueDioramaParts): number {
  const bounds = parts.framing.bounds();
  return (bounds.maxX - bounds.minX) / (bounds.maxY - bounds.minY);
}

/** One counter in the strip under the island. */
function Stat({ label, value }: Readonly<{ label: string; value: number }>): ReactNode {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-[12px] leading-none text-mute">{label}</dt>
      <dd className="font-dot text-lg font-bold leading-none tabular-nums text-ink">{value}</dd>
    </div>
  );
}

type IslandProps = Readonly<{
  parts: QueueDioramaParts;
  panel: QueuePanelContent;
  behaviour: DioramaBehaviour;
  running: boolean;
  onReady: () => void;
  onFailed: () => void;
}>;

/** The 3D island in its box, with the pointer's lean and drag, and the strip of counters under it. */
function Island({ parts, panel, behaviour, running, onReady, onFailed }: IslandProps): ReactNode {
  const boxRef = useRef<HTMLDivElement>(null);
  const { cursor, gesture, turn, lean, waker, toy } = parts;
  const snapshot = useSyncExternalStore(toy.loop.subscribe, toy.loop.view, toy.loop.view);

  useEffect(() => {
    cursor.attach(boxRef.current);
    return () => cursor.attach(null);
  }, [cursor]);
  useEffect(() => cursor.allowDrag(behaviour.drag), [cursor, behaviour]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    if (behaviour.drag && event.pointerType !== "touch" && event.button === 0) {
      gesture.down(event.clientX);
    }
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    const move = gesture.move(event.clientX);
    switch (move.kind) {
      case "hover":
        if (behaviour.parallax && event.pointerType !== "touch") {
          const box = event.currentTarget.getBoundingClientRect();
          lean.aim(event.clientX - box.left, event.clientY - box.top, box.width, box.height);
          waker.wake();
        }
        break;
      case "pending":
        break;
      case "start":
        event.currentTarget.setPointerCapture(event.pointerId);
        turn.grab();
        turn.drag(move.dx);
        cursor.grabbing(true);
        waker.wake();
        break;
      case "drag":
        turn.drag(move.dx);
        waker.wake();
        break;
      default:
        assertNever(move);
    }
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>): void => {
    if (gesture.up()) {
      turn.release();
      cursor.grabbing(false);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      waker.wake();
    }
  };

  return (
    <>
      <div
        ref={boxRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => lean.release()}
        style={{ aspectRatio: boxAspect(parts) }}
        className="relative isolate w-full touch-pan-y select-none"
      >
        <SceneBoundary onError={onFailed}>
          <QueueScene
            parts={parts}
            behaviour={behaviour}
            running={running}
            onReady={onReady}
            onLost={onFailed}
            onHover={(over) => cursor.hovering(over)}
          />
        </SceneBoundary>
        <QueueLabels pins={parts.pins} panel={panel} snapshot={snapshot} overflow={Math.max(0, snapshot.queued.length - parts.pile.capacity())} />
      </div>
      <div className="mx-auto flex w-full max-w-xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-2">
        <p className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{panel.title}</p>
        <dl className="flex gap-5">
          <Stat label={panel.readout.queued} value={snapshot.queued.length} />
          <Stat label={panel.readout.processed} value={snapshot.totals.processed} />
          <Stat label={panel.readout.restarts} value={snapshot.totals.restarts} />
        </dl>
        <button
          type="button"
          onClick={() => parts.button.press()}
          className="sr-only rounded-lg bg-signal px-4 py-2.5 text-sm font-semibold text-ink focus:not-sr-only"
        >
          {panel.send.label}
        </button>
      </div>
    </>
  );
}

/**
 * The Back end chapter's message queue, as a little 3D island: Checkout's kiosk with a big orange button
 * that sends a batch, a belt into the NATS broker's glass hopper where waiting messages pile up, and three
 * service machines that hum, rattle when busy, fall over and smoke when overloaded, and boing back after a
 * restart. The 2D board draws the same toy until WebGL is ready, if it fails, and under reduced motion.
 */
export function QueueDiorama({ panel }: Readonly<{ panel: QueuePanelContent }>): ReactNode {
  const [parts] = useState(() => composeQueueDiorama(panel));
  const [status, setStatus] = useState<SceneStatus>("loading");
  const rootRef = useRef<HTMLElement>(null);
  const running = usePanelLoop(rootRef);
  const reduced = useReducedMotion() === true;
  const wide = useSyncExternalStore(subscribeToWidth, isWide, () => true);
  const behaviour = useMemo(() => behaviourOf(pickMode(wide, reduced)), [wide, reduced]);
  const announcement = useAnnouncement(parts.toy);
  useQueueLoop(parts.toy, running);

  const solid = !reduced && status !== "failed";
  const ready = solid && status === "ready";

  return (
    <figure ref={rootRef} className="relative grid">
      <figcaption className="sr-only">{panel.label}</figcaption>
      <div
        aria-hidden={ready}
        className={cx(
          "[grid-area:1/1] transition-[opacity,visibility] duration-700 ease-out-expo motion-reduce:transition-none",
          ready ? "invisible absolute inset-0 overflow-hidden opacity-0" : "opacity-100",
        )}
      >
        <QueuePanel panel={panel} toy={parts.toy} flights={!ready} onSend={() => parts.button.press()} className="h-full" />
      </div>
      {solid ? (
        <div
          className={cx(
            "flex flex-col justify-center gap-3 [grid-area:1/1] transition-[opacity,visibility] duration-700 ease-out-expo",
            ready ? "opacity-100" : "invisible opacity-0",
          )}
        >
          <Island
            parts={parts}
            panel={panel}
            behaviour={behaviour}
            running={running}
            onReady={() => setStatus((current) => (current === "loading" ? "ready" : current))}
            onFailed={() => setStatus("failed")}
          />
        </div>
      ) : null}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </figure>
  );
}
