"use client";

import type { ReactNode } from "react";
import type { ServiceMapCopy } from "@/content";
import { cx } from "@/ui";
import { assertNever } from "../queue/assertNever";
import { breakerPill, healthSignal, metricText, queueSignal } from "./cardLook";
import type { DotPainter } from "./DotPainter";
import { ClientsGlyph, GatewayGlyph, PowerGlyph } from "./glyphs";
import type { MapLayout } from "./MapLayout";
import { boxStyle, CARD, Figure, NodeBadge, NodeText, Pill, StatusDot } from "./NodeCard";
import { STORES, type Edge, type ServiceId } from "./topology";
import type { MapSnapshot, ServiceView } from "./types";

/** Shows on the card's hover, keyboard focus or the ghost's hover; the figure hides meanwhile. */
const ON_HOVER = "opacity-0 group-hover/card:opacity-100 group-focus-visible/card:opacity-100 group-data-[ghost-over]/card:opacity-100";
const OFF_HOVER = "group-hover/card:opacity-0 group-focus-visible/card:opacity-0 group-data-[ghost-over]/card:opacity-0";

type EdgeLook = Readonly<{ stroke: string; dash: string | undefined; flow: boolean }>;

/** How an edge is drawn: a hairline, dashed red while its breaker is open, dashed amber while it tests. */
function edgeLook(edge: Edge, map: MapSnapshot): EdgeLook {
  const hairline: EdgeLook = { stroke: "rgb(60 30 15 / 0.22)", dash: undefined, flow: false };
  switch (edge.kind) {
    case "entry":
      return hairline;
    case "route": {
      const breaker = serviceOf(map, edge.service).breaker;
      switch (breaker) {
        case "closed":
          return hairline;
        case "open":
          return { stroke: "rgb(229 72 77 / 0.75)", dash: "3 3.5", flow: false };
        case "half-open":
          return { stroke: "rgb(229 161 58 / 0.9)", dash: "3 3.5", flow: true };
        default:
          return assertNever(breaker);
      }
    }
    case "store":
      return serviceOf(map, edge.service).health === "down" ? { stroke: "rgb(60 30 15 / 0.1)", dash: undefined, flow: false } : hairline;
    default:
      return assertNever(edge);
  }
}

function serviceOf(map: MapSnapshot, id: ServiceId): ServiceView {
  const view = map.services.find((service) => service.id === id);
  if (view === undefined) {
    throw new Error(`No such service on the map: ${id}`);
  }
  return view;
}

type ServiceCardProps = Readonly<{
  view: ServiceView;
  copy: ServiceMapCopy;
  layout: MapLayout;
  reduced: boolean;
  onTakeDown: (service: ServiceId) => void;
}>;

/**
 * A service's card, a real button: clicking it (or Enter on it) takes the service down. Hovering swaps its
 * figure for the action. Down, it greys and wears a red "Down"; restarted, an amber "Restarting".
 */
function ServiceCard({ view, copy, layout, reduced, onTakeDown }: ServiceCardProps): ReactNode {
  const node = copy.services[view.id];
  const up = view.health === "up";
  const signal = healthSignal(view.health);
  const label = up ? `${copy.takeDown}: ${node.name}` : `${node.name}: ${view.health === "down" ? copy.health.down : copy.health.recovering}`;
  return (
    <button
      type="button"
      data-ghost={`service-${view.id}`}
      aria-label={label}
      aria-disabled={!up}
      onClick={() => {
        if (up) {
          onTakeDown(view.id);
        }
      }}
      style={boxStyle(layout.node(view.id))}
      className={cx(
        CARD,
        "group/card transition-[background-color,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none",
        up
          ? "cursor-pointer hover:bg-[#fdfaf8] data-[ghost-over]:bg-[#fdfaf8] active:scale-[0.97] data-[ghost-press]:scale-[0.97]"
          : "cursor-default bg-[#f8f4f1]",
      )}
    >
      <NodeBadge tool={node.tool} muted={view.health === "down"} />
      <NodeText name={node.name} muted={view.health === "down"}>
        {up ? (
          <>
            <span className={cx("transition-opacity duration-150 motion-reduce:transition-none", OFF_HOVER)}>
              <Figure tone="quiet">{metricText(view.metric, copy.metrics)}</Figure>
            </span>
            <span className={cx("absolute inset-y-0 left-0 flex items-center gap-[4px] text-[11px] font-semibold leading-none text-[#c2410c] transition-opacity duration-150 motion-reduce:transition-none", ON_HOVER)}>
              <PowerGlyph className="size-[11px]" />
              {copy.takeDown}
            </span>
          </>
        ) : (
          <Pill signal={signal}>{view.health === "down" ? copy.health.down : copy.health.recovering}</Pill>
        )}
      </NodeText>
      <StatusDot signal={signal} reduced={reduced} />
    </button>
  );
}

/** What the dots and dashes mean, quietly, under the map. */
function Legend({ copy, at }: Readonly<{ copy: ServiceMapCopy["legend"]; at: Readonly<{ x: number; y: number }> }>): ReactNode {
  const key = "flex items-center gap-[6px]";
  return (
    <div aria-hidden className="absolute flex items-center gap-[16px] text-[11px] font-medium leading-none text-[#8a7f78]" style={{ left: at.x, top: at.y }}>
      <span className={key}>
        <span className="size-[6px] rounded-full bg-[#ff5a1f] shadow-[0_0_0_3px_rgb(255_90_31/0.16)]" />
        {copy.request}
      </span>
      <span className={key}>
        <span className="size-[6px] rounded-full bg-white shadow-[inset_0_0_0_1.3px_#ff5a1f,0_0_0_3px_rgb(255_90_31/0.16)]" />
        {copy.probe}
      </span>
      <span className={key}>
        <svg className="h-[2px] w-[16px]" viewBox="0 0 16 2">
          <path d="M0 1h16" stroke="rgb(229 72 77 / 0.75)" strokeWidth={1} strokeDasharray="3 3.5" />
        </svg>
        {copy.open}
      </span>
    </div>
  );
}

type MapCanvasProps = Readonly<{
  copy: ServiceMapCopy;
  map: MapSnapshot;
  layout: MapLayout;
  painter: DotPainter;
  reduced: boolean;
  onTakeDown: (service: ServiceId) => void;
}>;

/**
 * The service map: hairline edges with request dots flowing along them, the cards over them, and a pill on
 * any edge whose breaker is not closed. A faint dot grid sits behind, as on a diagram canvas.
 */
export function MapCanvas({ copy, map, layout, painter, reduced, onTakeDown }: MapCanvasProps): ReactNode {
  const { width, height } = layout.size();
  const gatewayFigure = metricText(map.gateway.metric, copy.metrics);
  const quiet = (id: "clients" | "gateway"): ReactNode => {
    const failing = id === "gateway" && map.gateway.failing;
    return (
      <div data-ghost={id} style={boxStyle(layout.node(id))} className={CARD}>
        <NodeBadge glyph={id === "clients" ? <ClientsGlyph className="size-[12px]" /> : <GatewayGlyph className="size-[12px]" />} muted={false} />
        <NodeText name={copy[id].name} muted={false}>
          <Figure tone={failing ? "alarm" : "quiet"}>{id === "clients" ? metricText(map.clients, copy.metrics) : gatewayFigure}</Figure>
        </NodeText>
        <StatusDot signal={failing ? "warn" : "ok"} reduced={reduced} />
      </div>
    );
  };

  return (
    <div className="relative flex-1 bg-[radial-gradient(rgb(60_30_15/0.085)_0.8px,transparent_0.8px)] bg-[size:14px_14px] bg-[position:7px_7px]">
      <div className="relative" style={{ width, height }}>
        <svg aria-hidden className="absolute inset-0 overflow-visible" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {layout.all().map((edge) => {
            const look = edgeLook(edge, map);
            return (
              <path key={layout.path(edge)} d={layout.path(edge)} fill="none" stroke={look.stroke} strokeWidth={1} strokeDasharray={look.dash} className="transition-[stroke] duration-300">
                {look.flow && !reduced ? <animate attributeName="stroke-dashoffset" from="0" to="-13" dur="0.9s" repeatCount="indefinite" /> : null}
              </path>
            );
          })}
          {painter.bindings().map((bind, index) => (
            <g key={index} ref={bind} data-flying="false" className="opacity-0 data-[flying=true]:opacity-100 data-[kind=probe]:[--dot-core:#fff] data-[kind=retry]:[--dot:#e5484d] data-[kind=retry]:[--dot-core:#e5484d]">
              <circle r={5.5} className="fill-[var(--dot,#ff5a1f)] opacity-[0.16]" />
              <circle r={2.9} className="fill-[var(--dot-core,#ff5a1f)] stroke-[var(--dot,#ff5a1f)] [stroke-width:1.3]" />
            </g>
          ))}
        </svg>

        {quiet("clients")}
        {quiet("gateway")}
        {map.services.map((view) => (
          <ServiceCard key={view.id} view={view} copy={copy} layout={layout} reduced={reduced} onTakeDown={onTakeDown} />
        ))}
        {STORES.map((store) => {
          const metric = map.stores[store];
          const queue = store === "nats";
          return (
            <div key={store} data-ghost={`store-${store}`} style={boxStyle(layout.node(store))} className={CARD}>
              <NodeBadge tool={copy.stores[store].tool} muted={false} />
              <NodeText name={copy.stores[store].name} muted={false}>
                <Figure tone="quiet">{metricText(metric, copy.metrics)}</Figure>
              </NodeText>
              <StatusDot signal={queue ? queueSignal(map.queueFill) : "ok"} reduced={reduced} />
              {queue ? (
                <span aria-hidden className="absolute bottom-[7px] left-[37px] right-[12px] h-[3px] overflow-hidden rounded-full bg-[rgb(60_30_15/0.08)]">
                  <span
                    className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-[linear-gradient(90deg,#ff8a4c,#ff5a1f)] transition-transform duration-500 ease-linear motion-reduce:transition-none"
                    style={{ transform: `scaleX(${map.queueFill})` }}
                  />
                </span>
              ) : null}
            </div>
          );
        })}

        <Legend copy={copy.legend} at={layout.legendSpot()} />

        {map.services.map((view) => {
          const pill = breakerPill(view.breaker, copy.breaker);
          if (pill === null) {
            return null;
          }
          const at = layout.breakerSpot(view.id);
          return (
            <span
              key={view.id}
              aria-hidden
              className="absolute flex -translate-x-1/2 -translate-y-1/2 animate-[map-pill_0.35s_cubic-bezier(0.16,1,0.3,1)] motion-reduce:animate-none"
              style={{ left: at.x, top: at.y }}
            >
              <Pill signal={pill.signal} className="shadow-[0_0_0_2.5px_#fff]">
                {pill.text}
              </Pill>
            </span>
          );
        })}
      </div>
    </div>
  );
}
