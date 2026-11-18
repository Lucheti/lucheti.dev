"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { AgentPanel, OfficePanel } from "@/content";
import { cx, SceneBoundary, usePanelLoop } from "@/ui";
import { AgentAtWorkPanel } from "./agent/AgentAtWorkPanel";
import { composeOfficeDiorama, type OfficeDioramaParts } from "./diorama/composeOfficeDiorama";
import { behaviourOf, pickMode, useIslandPointer, type DioramaBehaviour } from "./diorama/kit";
import { OfficeLabels } from "./diorama/OfficeLabels";
import { TRAY_SHOWN } from "./diorama/OfficeLayout";
import type { OfficeSnapshot, OfficeToy } from "./office";

// WebGL has no server render; three.js and the scene are fetched only in the browser.
const OfficeScene = dynamic(() => import("./diorama/OfficeScene"), { ssr: false });

/** Tablet width and up: where the island leans and drags. Matches Tailwind's `md`. */
const WIDE_QUERY = "(min-width: 768px)";

/** Where the WebGL scene stands: loading behind the 2D panel, drawing, or given up on. */
type SceneStatus = "loading" | "ready" | "failed";

function subscribeToWidth(onChange: () => void): () => void {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const isWide = (): boolean => window.matchMedia(WIDE_QUERY).matches;

/** The latest sentence about the office for the live region: an idea dropped, a ticket sent back, one shipped. */
function useAnnouncement(toy: OfficeToy): string {
  const [announcement, setAnnouncement] = useState("");
  useEffect(
    () =>
      toy.office.listen((events) => {
        const sentence = toy.announcer.describe(events);
        if (sentence !== null) {
          setAnnouncement(sentence);
        }
      }),
    [toy],
  );
  return announcement;
}

/** The island's box takes the shape of its drawing, so it fills the column with no dead bands. */
function boxAspect(parts: OfficeDioramaParts): number {
  const bounds = parts.framing.bounds();
  return (bounds.maxX - bounds.minX) / (bounds.maxY - bounds.minY);
}

/** One counter in the strip under the island. */
function Stat({ label, value }: Readonly<{ label: string; value: number }>): ReactNode {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-[12px] leading-none text-mute">{label}</dt>
      <dd className="text-lg font-bold leading-none tabular-nums text-ink">{value}</dd>
    </div>
  );
}

/** The ticket the strip follows, and the department it is at or on its way to. */
function CurrentTicket({ snapshot, office }: Readonly<{ snapshot: OfficeSnapshot; office: OfficePanel }>): ReactNode {
  const { current } = snapshot;
  if (current === null) {
    return <p className="text-[13px] leading-5 text-mute">{office.readout.idle}</p>;
  }
  return (
    <p className="flex min-w-0 items-center gap-2 text-[13px] leading-5">
      <svg aria-hidden viewBox="0 0 16 16" className="size-4 shrink-0">
        <rect x="2" y="3.5" width="12" height="9" rx="1.8" strokeWidth="1.3" className="fill-[#ffd84a] stroke-ink" />
        <path d="M2.7 6.4h10.6" strokeWidth="2.2" className="stroke-signal" />
      </svg>
      <span className="flex min-w-0 items-baseline gap-1.5">
        <span className="whitespace-nowrap font-semibold text-ink">{current.name.id}</span>
        <span className="truncate text-ink-soft">{current.name.title}</span>
      </span>
      <span key={current.station} className="shrink-0 rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold leading-4 text-paper">
        {office.departments[current.station]}
      </span>
    </p>
  );
}

type IslandProps = Readonly<{
  parts: OfficeDioramaParts;
  office: OfficePanel;
  behaviour: DioramaBehaviour;
  running: boolean;
  onReady: () => void;
  onFailed: () => void;
}>;

/** The 3D island in its box, with the pointer's lean and drag, and the strip under it. */
function Island({ parts, office, behaviour, running, onReady, onFailed }: IslandProps): ReactNode {
  const { cursor, toy } = parts;
  const snapshot = useSyncExternalStore(toy.office.subscribe, toy.office.view, toy.office.view);
  const { boxRef, ...pointer } = useIslandPointer(parts, behaviour);

  return (
    <>
      {/* `min-h-0`: the canvas's pixel height must not hold the box taller than its aspect after a resize. */}
      <div ref={boxRef} {...pointer} style={{ aspectRatio: boxAspect(parts) }} className="relative isolate min-h-0 w-full touch-pan-y select-none">
        <SceneBoundary onError={onFailed}>
          <OfficeScene
            parts={parts}
            behaviour={behaviour}
            running={running}
            onReady={onReady}
            onLost={onFailed}
            onHover={(over) => cursor.hovering(over)}
          />
        </SceneBoundary>
        <OfficeLabels pins={parts.pins} office={office} overflow={Math.max(0, snapshot.waiting - TRAY_SHOWN)} />
      </div>
      {/* On a phone the ticket line takes its own row under the title and counters. */}
      <div className="mx-auto flex w-full max-w-xl flex-wrap items-center justify-between gap-x-5 gap-y-2 px-2">
        <p className="order-1 shrink-0 text-[15px] font-semibold tracking-[-0.01em] text-ink">{office.title}</p>
        <div className="order-3 flex w-full min-w-0 sm:order-2 sm:w-auto sm:flex-1">
          <CurrentTicket snapshot={snapshot} office={office} />
        </div>
        <dl className="order-2 flex gap-5 sm:order-3">
          {snapshot.waiting > 0 ? <Stat label={office.readout.waiting} value={snapshot.waiting} /> : null}
          <Stat label={office.readout.shipped} value={snapshot.shipped} />
        </dl>
        <button
          type="button"
          onClick={() => parts.button.press()}
          className="order-4 sr-only rounded-lg bg-signal px-4 py-2.5 text-sm font-semibold text-ink focus:not-sr-only"
        >
          {office.drop.label}
        </button>
      </div>
    </>
  );
}

/**
 * The AI chapter's island: the Orchestra office, where departments of robots take a ticket from Product
 * (stamped) through Design (sketched) and Engineering (three engineers at once) to QA, which now and then
 * sends it back, and Release, which launches it in a tiny rocket. A big orange button drops new ideas into
 * Product's inbox. The 2D agent panel stands in until WebGL is ready, if it fails, and under reduced motion.
 */
export function OfficeDiorama({ office, panel }: Readonly<{ office: OfficePanel; panel: AgentPanel }>): ReactNode {
  const [parts] = useState(() => composeOfficeDiorama(office, panel.tickets));
  const [status, setStatus] = useState<SceneStatus>("loading");
  const [faded, setFaded] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const running = usePanelLoop(rootRef);
  const reduced = useReducedMotion() === true;
  const wide = useSyncExternalStore(subscribeToWidth, isWide, () => true);
  const behaviour = useMemo(() => behaviourOf(pickMode(wide, reduced)), [wide, reduced]);
  const announcement = useAnnouncement(parts.toy);

  const solid = !reduced && status !== "failed";
  const ready = solid && status === "ready";

  return (
    // The drawing keeps a margin above the island's top labels; pulling the box up by about that much puts
    // them level with the heading beside it.
    // One column that never grows past the figure (minmax(0, 1fr)), so the canvas's pixel width can't hold it open.
    <figure ref={rootRef} className="relative grid grid-cols-1 lg:-mt-[5%]">
      <figcaption className="sr-only">{office.label}</figcaption>
      <div
        aria-hidden={ready}
        onTransitionEnd={(event) => setFaded(ready && event.target === event.currentTarget)}
        className={cx(
          "[grid-area:1/1] transition-[opacity,visibility] duration-700 ease-out-expo motion-reduce:transition-none",
          ready ? "invisible absolute inset-0 overflow-hidden opacity-0" : "opacity-100",
        )}
      >
        {/* Once the island has faded in, the 2D panel stops playing out of sight; it comes back if WebGL is lost. */}
        {ready && faded ? null : <AgentAtWorkPanel panel={panel} />}
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
            office={office}
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
