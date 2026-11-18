import type { MapServiceId, MapStoreId } from "@/content";

export type ServiceId = MapServiceId;
export type StoreId = MapStoreId;

/** A box on the map. */
export type NodeId = "clients" | "gateway" | ServiceId | StoreId;

/** The services behind the gateway, top to bottom. */
export const SERVICES: readonly ServiceId[] = ["orders", "payments", "inventory"];

/** The stores and the queue, top to bottom. */
export const STORES: readonly StoreId[] = ["postgres", "nats", "redis"];

/**
 * A line between two boxes, drawn from `from` to `to`. Requests travel it forwards; messages drained from the
 * queue travel a service's edge to NATS backwards.
 */
export type Edge =
  | Readonly<{ kind: "entry" }>
  | Readonly<{ kind: "route"; service: ServiceId }>
  | Readonly<{ kind: "store"; service: ServiceId; store: StoreId }>;

/** Which stores each service talks to. Every one publishes to and drains the queue; the edges never cross. */
export const STORE_LINKS: Readonly<Record<ServiceId, readonly StoreId[]>> = {
  orders: ["postgres", "nats"],
  payments: ["nats"],
  inventory: ["nats", "redis"],
};

/** Every edge on the map, in drawing order. */
export function allEdges(): readonly Edge[] {
  return [
    { kind: "entry" },
    ...SERVICES.map((service): Edge => ({ kind: "route", service })),
    ...SERVICES.flatMap((service) => STORE_LINKS[service].map((store): Edge => ({ kind: "store", service, store }))),
  ];
}

/**
 * The map's edges, each made once, so dots in the air point at the same edge objects the painter and the
 * layout know, and launching a dot never builds one.
 */
export class EdgeBook {
  private readonly edges: readonly Edge[] = allEdges();

  public entry(): Edge {
    return this.find((edge) => edge.kind === "entry");
  }

  public route(service: ServiceId): Edge {
    return this.find((edge) => edge.kind === "route" && edge.service === service);
  }

  public store(service: ServiceId, store: StoreId): Edge {
    return this.find((edge) => edge.kind === "store" && edge.service === service && edge.store === store);
  }

  public all(): readonly Edge[] {
    return this.edges;
  }

  private find(match: (edge: Edge) => boolean): Edge {
    const edge = this.edges.find(match);
    if (edge === undefined) {
      throw new Error("The map has no such edge");
    }
    return edge;
  }
}

/** The services that drain the queue. */
export function queueConsumers(): readonly ServiceId[] {
  return SERVICES.filter((service) => STORE_LINKS[service].includes("nats"));
}
