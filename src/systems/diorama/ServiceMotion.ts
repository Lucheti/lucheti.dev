import type { ServiceStatusKind } from "../queue/types";

/** What the renderer saw of one service in a frame. */
export type ServiceSighting = Readonly<{ kind: ServiceStatusKind; processed: number }>;

type Watch = {
  kind: ServiceStatusKind;
  since: number;
  processed: number;
  finishedAt: number;
  backAt: number;
};

const NEVER = Number.NEGATIVE_INFINITY;

/**
 * When things happened to each service, on the renderer's own clock (seconds), so the machines can play
 * them as curves of age: how long it has been in its status (the fuse, the smoke, the blink), when it last
 * finished a message (a small hop), and when it came back from a restart (the "boing"). Pure: time comes
 * in with each sighting.
 */
export class ServiceMotion {
  private readonly watches: Watch[] = [];

  /** The services as seen at `now`, in order. */
  public observe(sightings: readonly ServiceSighting[], now: number): void {
    sightings.forEach((sighting, index) => {
      const watch = this.watches[index];
      if (watch === undefined) {
        this.watches[index] = { kind: sighting.kind, since: now, processed: sighting.processed, finishedAt: NEVER, backAt: NEVER };
        return;
      }
      if (sighting.kind !== watch.kind) {
        if (watch.kind === "restarting" && sighting.kind === "healthy") {
          watch.backAt = now;
        }
        watch.kind = sighting.kind;
        watch.since = now;
      }
      if (sighting.processed > watch.processed) {
        watch.finishedAt = now;
      }
      watch.processed = sighting.processed;
    });
  }

  /** Seconds service `index` has been in its status at `now`. */
  public inStatus(index: number, now: number): number {
    return now - this.watch(index).since;
  }

  /** Seconds since service `index` last finished a message; infinite if it never has. */
  public sinceFinished(index: number, now: number): number {
    return now - this.watch(index).finishedAt;
  }

  /** Seconds since service `index` came back from a restart; infinite if it never has. */
  public sinceBack(index: number, now: number): number {
    return now - this.watch(index).backAt;
  }

  private watch(index: number): Watch {
    const watch = this.watches[index];
    if (watch === undefined) {
      throw new Error(`Service ${index} has not been seen yet`);
    }
    return watch;
  }
}
