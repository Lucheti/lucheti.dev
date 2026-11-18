import type { GhostHands, GhostMarks, GhostStep, Point, Size } from "@/laptop";
import { assertNever } from "../queue/assertNever";
import type { ServiceId, StoreId } from "./topology";

/** Something on the ops app the ghost cursor can go to. */
export type MapTarget =
  | Readonly<{ kind: "rest" }>
  | Readonly<{ kind: "service"; service: ServiceId }>
  | Readonly<{ kind: "store"; store: StoreId }>
  | Readonly<{ kind: "spike" }>;

/** What the ghost's clicks do to the map. */
export type MapEffect = Readonly<{ kind: "take-down"; service: ServiceId }> | Readonly<{ kind: "spike" }>;

/** What the visitor and the ghost can do to the map. */
export interface MapActions {
  /** Takes a service down; says whether it went down. */
  takeDown(service: ServiceId): boolean;
  /** Starts a spike; says whether it started. */
  spike(): boolean;
}

/** How the ops app marks its places for the ghost (`data-ghost`), and where on each the cursor rests. */
export class MapMarks implements GhostMarks<MapTarget> {
  public readonly rest: MapTarget = { kind: "rest" };

  public keyOf(target: MapTarget): string {
    switch (target.kind) {
      case "rest":
      case "spike":
        return target.kind;
      case "service":
        return `service-${target.service}`;
      case "store":
        return `store-${target.store}`;
      default:
        return assertNever(target);
    }
  }

  public aim(target: MapTarget, size: Size): Point {
    switch (target.kind) {
      case "service":
      case "store":
        return { x: Math.min(48, size.width / 2), y: size.height * 0.6 };
      case "spike":
        return { x: size.width * 0.42, y: size.height / 2 };
      case "rest":
        return { x: size.width / 2, y: size.height / 2 };
      default:
        return assertNever(target);
    }
  }
}

/** Turns the ghost's clicks into the same actions a visitor's would take on the map. */
export class MapHands implements GhostHands<MapEffect> {
  public constructor(private readonly actions: MapActions) {}

  public apply(effect: MapEffect): void {
    switch (effect.kind) {
      case "take-down":
        this.actions.takeDown(effect.service);
        break;
      case "spike":
        this.actions.spike();
        break;
      default:
        assertNever(effect);
    }
  }

  /** The map keeps no half-open menus, so there is nothing to put back before a loop. */
  public tidy(): void {}

  /** Nor anything to put away when the visitor takes over. */
  public letGo(): void {}
}

/**
 * The ghost's calm loop on the map: it looks at a service, takes it down and steps back to watch the gateway
 * open its breaker, test the service and close again; then it simulates a spike, watches the queue fill and
 * drain, and rests. It takes `victim` down each time.
 */
export function mapGhostLoop(victim: ServiceId): readonly GhostStep<MapTarget, MapEffect>[] {
  return [
    { kind: "wait", ms: 1600 },
    { kind: "move", to: { kind: "service", service: victim }, ms: 1500 },
    { kind: "wait", ms: 1500 },
    { kind: "click", effect: { kind: "take-down", service: victim }, ms: 400 },
    { kind: "wait", ms: 1400 },
    { kind: "move", to: { kind: "rest" }, ms: 1600 },
    { kind: "wait", ms: 8000 },
    { kind: "move", to: { kind: "spike" }, ms: 1700 },
    { kind: "wait", ms: 600 },
    { kind: "click", effect: { kind: "spike" }, ms: 400 },
    { kind: "wait", ms: 1600 },
    { kind: "move", to: { kind: "store", store: "nats" }, ms: 1500 },
    { kind: "wait", ms: 5200 },
    { kind: "move", to: { kind: "rest" }, ms: 1600 },
    { kind: "wait", ms: 7000 },
  ];
}
