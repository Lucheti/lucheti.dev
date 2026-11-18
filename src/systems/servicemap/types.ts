import type { BreakerPhase } from "./CircuitBreaker";
import type { HealthPhase } from "./ServiceHealth";
import type { ServiceId, StoreId } from "./topology";

/** Something the visitor should hear about, in the live region. */
export type MapEvent =
  | Readonly<{ kind: "down"; service: ServiceId }>
  | Readonly<{ kind: "opened"; service: ServiceId }>
  | Readonly<{ kind: "probing"; service: ServiceId }>
  | Readonly<{ kind: "back"; service: ServiceId }>
  | Readonly<{ kind: "spike" }>
  | Readonly<{ kind: "settled" }>;

/** The tiny figure on a card. */
export type NodeMetric =
  | Readonly<{ kind: "rate"; n: number }>
  | Readonly<{ kind: "ops"; n: number }>
  | Readonly<{ kind: "p95"; n: number }>
  | Readonly<{ kind: "queued"; n: number }>
  | Readonly<{ kind: "failed-fast"; n: number }>;

/** One service as its card and its edge from the gateway show it. */
export type ServiceView = Readonly<{
  id: ServiceId;
  health: HealthPhase;
  /** The gateway's breaker on its edge. */
  breaker: BreakerPhase;
  metric: NodeMetric;
}>;

/** The map as React draws it; it changes only when `revision` does. */
export type MapSnapshot = Readonly<{
  revision: number;
  clients: NodeMetric;
  /** The gateway's figure, and whether it is failing requests fast for a service. */
  gateway: Readonly<{ metric: NodeMetric; failing: boolean }>;
  services: readonly ServiceView[];
  stores: Readonly<Record<StoreId, NodeMetric>>;
  /** How full the queue's depth bar is, from 0 to 1. */
  queueFill: number;
  spiking: boolean;
  /** Services that are down or not yet trusted again. */
  incidents: number;
}>;
