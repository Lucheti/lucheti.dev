import type { FlightView } from "../queue/types";
import type { HopperPile } from "./HopperPile";
import type { ParcelDrop } from "./ParcelDrop";
import type { ParcelTracks } from "./ParcelTracks";
import type { QueueModel } from "./QueueModel";
import type { HopperPlan } from "./QueueLayout";
import { point } from "./kit";

/** A small turn each parcel keeps, from its id, so a pile looks tossed in rather than stacked by a robot. */
function jitter(id: number): number {
  return (((id * 37) % 11) - 5) * 0.045;
}

/**
 * Poses the messages: the ones waiting pile up in the hopper (each dropping into place under gravity), and
 * the ones in the air ride their tracks, tumbling a little as they are thrown; a message handed back by a
 * machine that fell over is drawn in cream with orange tape.
 */
export class ParcelPoser {
  public constructor(
    private readonly model: QueueModel,
    private readonly pile: HopperPile,
    private readonly drop: ParcelDrop,
    private readonly tracks: ParcelTracks,
    private readonly hopper: HopperPlan,
    /** The belt's slope, in radians, so parcels riding it sit flat on it. */
    private readonly beltSlope: number,
  ) {}

  /** Poses the pile for the queue's ids (head first) and the parcels for this frame's flights. */
  public pose(queued: readonly number[], flights: readonly FlightView[], seconds: number): void {
    this.pile.sync(queued);
    const slots = this.pile.slots();
    for (const slot of slots) {
      this.drop.restAt(slot.id, this.hopper.floor + slot.level * this.hopper.pitch);
    }
    this.drop.step(seconds);
    const pool = this.model.pile();
    pool.begin();
    for (const slot of slots) {
      const column = this.hopper.columns[slot.column];
      pool.place(point(column.x, this.drop.height(slot.id), column.z), jitter(slot.id), 0, false);
    }
    pool.end();

    const flying = this.model.flying();
    flying.begin();
    for (const flight of flights) {
      const { at, returning, riding } = this.tracks.place(flight);
      const tumble = riding ? 0 : flight.progress * Math.PI * (returning ? -1.5 : 1);
      if (!flying.place(at, riding ? 0 : jitter(flight.id) + tumble, riding ? this.beltSlope : tumble * 0.3, returning)) {
        break;
      }
    }
    flying.end();
  }

  /** Whether a parcel is still dropping into the pile. */
  public settling(): boolean {
    return this.drop.falling();
  }
}
