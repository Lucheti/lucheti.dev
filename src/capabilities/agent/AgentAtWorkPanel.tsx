"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { AgentPanel, AgentTicket } from "@/content";
import { FeaturePanel, usePanelLoop } from "@/ui";
import { WIDE_FROM_PX } from "./agentConfig";
import { AgentStage } from "./AgentStage";
import { composeAgentToy } from "./composeAgentToy";
import { useStageKind } from "./useStageKind";

/** The agent's face in a little ink tile, leading the title. */
function AgentMark(): ReactNode {
  return (
    <span aria-hidden className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-ink">
      <svg viewBox="0 0 16 16" className="size-4">
        <rect x="2.5" y="4.5" width="11" height="8" rx="3.5" className="fill-white" />
        <circle cx="6" cy="8.5" r="1.1" className="fill-ink" />
        <circle cx="10" cy="8.5" r="1.1" className="fill-ink" />
        <circle cx="8" cy="2" r="1.5" className="fill-signal" />
      </svg>
    </span>
  );
}

/** The shipped counter at the end of the title row; it bumps when a ticket goes in. */
function ShippedCount({ label, count }: Readonly<{ label: string; count: number }>): ReactNode {
  return (
    <p className="flex shrink-0 items-baseline gap-2">
      <span className="font-label text-[11px] font-medium uppercase tracking-[0.16em] text-mute">{label}</span>
      <span
        key={count}
        className="inline-block min-w-[2ch] text-right text-xl font-semibold leading-none tabular-nums text-ink motion-safe:animate-[toy-tick_420ms_ease-out]"
      >
        {count}
      </span>
    </p>
  );
}

/** The ticket in hand: its id and title, with a check once it has shipped. */
function TicketLine({ ticket, delivered }: Readonly<{ ticket: AgentTicket; delivered: boolean }>): ReactNode {
  return (
    <p className="flex min-w-0 items-center gap-2 text-[13px] leading-5">
      <svg aria-hidden viewBox="0 0 16 16" className="size-4 shrink-0">
        <rect x="2" y="3.5" width="12" height="9" rx="1.8" strokeWidth="1.3" className="fill-white stroke-ink" />
        <path d="M2.7 6.4h10.6" strokeWidth="2.6" className="stroke-signal" />
      </svg>
      <span key={ticket.id} className="flex min-w-0 items-baseline gap-1.5 motion-safe:animate-[toy-bubble_320ms_ease-out_both]">
        <span className="font-semibold">{ticket.id}</span>
        <span className="truncate text-ink-soft">{ticket.title}</span>
      </span>
      {delivered ? (
        <svg aria-hidden viewBox="0 0 12 12" className="size-3 shrink-0">
          <path d="m2.5 6.3 2.3 2.3 4.7-5" fill="none" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="stroke-signal" />
        </svg>
      ) : null}
    </p>
  );
}

/**
 * The AI feature panel, "Agent at work": a little agent picks up a ticket, carries it through Read,
 * Search, Code and Test with its tool calls in a speech bubble, and drops it into Ship with a pop. Now
 * and then a test fails and it goes back to fix the code. Clicking it makes it wave. It plays while on
 * screen; under reduced motion it rests at its desk.
 */
export function AgentAtWorkPanel({ panel }: Readonly<{ panel: AgentPanel }>): ReactNode {
  const rootRef = useRef<HTMLDivElement>(null);
  const playing = usePanelLoop(rootRef);
  const stage = useStageKind(rootRef, WIDE_FROM_PX);
  const [toy] = useState(() => composeAgentToy(panel));
  const view = useSyncExternalStore(toy.loop.subscribe, toy.loop.view, toy.loop.view);

  useEffect(() => toy.loop.showStage(stage), [toy, stage]);

  useEffect(() => {
    if (!playing) {
      return undefined;
    }
    toy.loop.play();
    return () => toy.loop.pause();
  }, [playing, toy]);

  useEffect(() => () => toy.loop.dispose(), [toy]);

  const greet = useCallback(() => toy.loop.greet(), [toy]);

  const { frame } = view;
  const pose = (playing ? toy.posers.live : toy.posers.still).pose(frame, view.clockMs);

  return (
    <FeaturePanel
      label={panel.label}
      title={panel.title}
      lead={<AgentMark />}
      aside={<ShippedCount label={panel.shipped} count={frame.shipped} />}
    >
      <div ref={rootRef} className="flex flex-1 flex-col gap-5">
        <div className="flex flex-1 items-center pt-8">
          <AgentStage
            layout={toy.layouts[view.stage]}
            frame={frame}
            pose={pose}
            names={panel.stations}
            greetLabel={panel.greet}
            onGreet={greet}
          />
        </div>
        <div className="flex flex-col gap-1.5 border-t border-line pt-4">
          <TicketLine ticket={frame.ticket} delivered={frame.delivered} />
          <p className="text-xs leading-5 text-mute">{panel.caption}</p>
        </div>
        <p aria-live="polite" className="sr-only">
          {frame.action.kind === "greet" ? panel.greeted : ""}
        </p>
      </div>
    </FeaturePanel>
  );
}
