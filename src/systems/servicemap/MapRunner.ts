import type { FrameListener } from "@/laptop";
import type { ManualClock } from "../queue/Clock";
import type { MapActions } from "./mapGhost";
import type { ServiceMapSimulation } from "./ServiceMapSimulation";
import type { ServiceId } from "./topology";
import type { MapEvent, MapSnapshot } from "./types";

type Listener = () => void;
type Hearer = (events: readonly MapEvent[]) => void;

/**
 * Runs the service map on the screen's frames and is the panel's store: React reads `snapshot()` through
 * `useSyncExternalStore` and re-renders only when it changes, and the live region hears each frame's events.
 * The visitor's and the ghost's actions come through here too, so they show at once, even with no frames.
 */
export class MapRunner implements FrameListener, MapActions {
  private shown: MapSnapshot;
  private readonly listeners = new Set<Listener>();
  private readonly hearers = new Set<Hearer>();

  public constructor(
    private readonly simulation: ServiceMapSimulation,
    private readonly clock: ManualClock,
  ) {
    this.shown = simulation.snapshot();
  }

  /** The map as last published. */
  public readonly snapshot = (): MapSnapshot => this.shown;

  /** Calls `listener` whenever `snapshot()` changes; returns the unsubscribe. */
  public readonly subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** Calls `hearer` with each batch of events; returns the unsubscribe. */
  public listen(hearer: Hearer): () => void {
    this.hearers.add(hearer);
    return () => this.hearers.delete(hearer);
  }

  public takeDown(service: ServiceId): boolean {
    const went = this.simulation.takeDown(service);
    this.flush();
    return went;
  }

  public spike(): boolean {
    const started = this.simulation.spike();
    this.flush();
    return started;
  }

  public frame(_now: number, stepMs: number): void {
    this.clock.advance(stepMs);
    this.simulation.update();
    this.flush();
  }

  /** Off screen the map simply waits; it picks up where it was. */
  public halt(): void {}

  private flush(): void {
    const next = this.simulation.snapshot();
    if (next !== this.shown) {
      this.shown = next;
      this.listeners.forEach((listener) => listener());
    }
    const events = this.simulation.takeEvents();
    if (events.length > 0) {
      this.hearers.forEach((hearer) => hearer(events));
    }
  }
}
