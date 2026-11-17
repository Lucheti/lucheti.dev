"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import type { PanelNode, RequestPanel as RequestPanelContent } from "@/content";
import { cx, FeaturePanel, toolIcon, ToolSwatch, usePanelLoop } from "@/ui";

/** Seconds between one row of links and the next, so a packet reads as one request travelling down. */
const HOP_SECONDS = 0.75;
/** A small lag between parallel links of the same row. */
const LANE_SECONDS = 0.08;
const PACKET_LOOP = "animate-[panel-packet_3.2s_linear_infinite_backwards]";

/** The alpha suffixes that tint a bar with its brand colour: about 12% fill and 40% edge. */
const TINT_FILL = "1f";
const TINT_EDGE = "66";

const SINGLE_GRID = "grid grid-cols-1";
const SERVICE_GRID = "grid grid-cols-3 gap-2 sm:gap-3";
const STORE_GRID = "grid grid-cols-2 gap-2 sm:gap-3";

const NODE = "rounded-xl border border-line-dark bg-graphite-raised";
const NAME = "truncate text-[13px] font-semibold leading-tight text-fog sm:text-sm";
const DETAIL = "truncate text-xs leading-tight text-fog-dim";

/** Where a link sits: its row from the top and its lane within the row. */
type Hop = Readonly<{ row: number; lane: number }>;

/** A 20 px vertical link with one orange packet on it; the packet only moves while the panel runs. */
function LinkLine({ hop, running }: Readonly<{ hop: Hop; running: boolean }>): ReactNode {
  const delay: CSSProperties = { animationDelay: `${hop.row * HOP_SECONDS + hop.lane * LANE_SECONDS}s` };
  return (
    <span className="relative mx-auto block h-5 w-px bg-line-dark-strong">
      <span
        className={cx(
          "absolute left-1/2 -ml-[3px] size-1.5 rounded-full bg-signal shadow-[0_0_0_3px_rgb(255_90_31/0.25)]",
          running ? cx("top-0", PACKET_LOOP) : "top-[7px]",
        )}
        style={running ? delay : undefined}
      />
    </span>
  );
}

type LinksProps = Readonly<{
  row: number;
  lanes: number;
  /** The grid of the nodes below, so each link lands on the centre of its node. */
  grid: string;
  running: boolean;
}>;

/** A row of links, one per column below it. */
function Links({ row, lanes, grid, running }: LinksProps): ReactNode {
  return (
    <div className={grid}>
      {Array.from({ length: lanes }, (_, lane) => (
        <LinkLine key={lane} hop={{ row, lane }} running={running} />
      ))}
    </div>
  );
}

/** A service or store: its brand swatch, its name and an optional second line; stacked on phones. */
function NodeCard({ node }: Readonly<{ node: PanelNode }>): ReactNode {
  return (
    <div className={cx(NODE, "flex min-w-0 flex-col items-start gap-2 p-2.5 sm:flex-row sm:items-center sm:gap-2.5 sm:p-3")}>
      <ToolSwatch tool={node.tool} tone="dark" size="md" />
      <span className="flex min-w-0 max-w-full flex-col gap-0.5">
        <span className={NAME}>{node.name}</span>
        {node.detail ? <span className={DETAIL}>{node.detail}</span> : null}
      </span>
    </div>
  );
}

/** A full-width bar (the gateway, the bus), tinted with its brand colour when it has one. */
function Bar({ node, tinted = false, chip }: Readonly<{ node: PanelNode; tinted?: boolean; chip?: string }>): ReactNode {
  const hex = toolIcon(node.tool)?.hex;
  const tint: CSSProperties | undefined =
    tinted && hex ? { backgroundColor: `#${hex}${TINT_FILL}`, borderColor: `#${hex}${TINT_EDGE}` } : undefined;
  return (
    <div className={cx(NODE, "flex min-w-0 items-center justify-between gap-3 px-3 py-2.5 sm:px-4")} style={tint}>
      <span className="flex min-w-0 items-center gap-2.5">
        <ToolSwatch tool={node.tool} tone="dark" size="md" />
        <span className={NAME}>{node.name}</span>
      </span>
      {chip ? (
        <span className="hidden shrink-0 rounded-md bg-fog/10 px-2 py-1 text-xs font-medium text-fog sm:inline">{chip}</span>
      ) : null}
    </div>
  );
}

/** A browser window, small. */
function WindowGlyph(): ReactNode {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-4 text-fog-dim">
      <rect x="1.5" y="2.5" width="13" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <path d="M1.5 5.5h13" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

/**
 * The back end's feature panel: one checkout request from the client, through the gateway and three
 * services, over the NATS bus, into PostgreSQL and Redis. Orange packets travel the links while the
 * panel is on screen; under reduced motion they rest on the links.
 */
export function RequestPanel({ panel }: Readonly<{ panel: RequestPanelContent }>): ReactNode {
  const rootRef = useRef<HTMLDivElement>(null);
  const running = usePanelLoop(rootRef);

  return (
    <FeaturePanel label={panel.label} title={panel.title}>
      <div ref={rootRef} aria-hidden className="flex flex-1 flex-col justify-center">
        <div className="flex justify-center">
          <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-line-dark-strong bg-graphite-raised py-1.5 pl-3 pr-1.5 text-sm font-medium text-fog">
            <WindowGlyph />
            {panel.client}
            <span className="rounded-full bg-signal px-2 py-0.5 text-xs font-semibold text-graphite">{panel.request}</span>
          </span>
        </div>
        <Links row={0} lanes={1} grid={SINGLE_GRID} running={running} />
        <Bar node={panel.gateway} chip={panel.gateway.detail} />
        <Links row={1} lanes={panel.services.length} grid={SERVICE_GRID} running={running} />
        <div className={SERVICE_GRID}>
          {panel.services.map((service) => (
            <NodeCard key={service.name} node={service} />
          ))}
        </div>
        <Links row={2} lanes={panel.services.length} grid={SERVICE_GRID} running={running} />
        <Bar node={panel.bus} tinted chip={panel.bus.detail} />
        <Links row={3} lanes={panel.stores.length} grid={STORE_GRID} running={running} />
        <div className={STORE_GRID}>
          {panel.stores.map((store) => (
            <NodeCard key={store.name} node={store} />
          ))}
        </div>
      </div>
    </FeaturePanel>
  );
}
