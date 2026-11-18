import { assertNever } from "../queue/assertNever";
import type { FlightView } from "../queue/types";
import { arc, lerp, type Point3 } from "./kit";
import { DISPATCH_HOP, RETURN_HOP, type TrackAnchors } from "./QueueLayout";

/** A parcel in the air: where it is, and whether it is a message handed back by a machine that fell over. */
export type ParcelPlace = Readonly<{
  at: Point3;
  returning: boolean;
  /** Whether it is riding the belt, rather than flying through the air. */
  riding: boolean;
}>;

/** The share of a trip to the queue spent riding the belt; the rest is the toss into the hopper. */
const BELT_SHARE = 0.62;
/** How high the toss off the belt rises over the hopper's mouth. */
const TOSS_HOP = 0.35;

/** Eased in and out, so a thrown parcel leaves and lands gently. */
function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * Where each message in the air is drawn for its flight's progress: from the kiosk it rides the belt up
 * and is tossed into the hopper's mouth; from the hopper's spout it is thrown in an arc onto a machine's
 * tray; and handed back by a machine that fell over, it is thrown higher, back into the mouth. Pure.
 */
export class ParcelTracks {
  public constructor(private readonly anchors: TrackAnchors) {}

  /** Where `flight` is drawn now. */
  public place(flight: FlightView): ParcelPlace {
    const progress = Math.min(1, Math.max(0, flight.progress));
    const { from, to } = flight;
    switch (to.kind) {
      case "queue":
        return from.kind === "service"
          ? { at: arc(this.tray(from.index), this.anchors.mouth, RETURN_HOP, smooth(progress)), returning: true, riding: false }
          : { at: this.inbound(progress), returning: false, riding: progress < BELT_SHARE };
      case "service":
        return { at: arc(this.anchors.spout, this.tray(to.index), DISPATCH_HOP, smooth(progress)), returning: false, riding: false };
      case "producer":
        throw new Error(`Message ${flight.id} cannot fly back to the producer`);
      default:
        return assertNever(to);
    }
  }

  /** On the belt, then tossed into the mouth. */
  private inbound(progress: number): Point3 {
    const { outlet, beltEnd, mouth } = this.anchors;
    if (progress < BELT_SHARE) {
      return lerp(outlet, beltEnd, progress / BELT_SHARE);
    }
    return arc(beltEnd, mouth, TOSS_HOP, (progress - BELT_SHARE) / (1 - BELT_SHARE));
  }

  private tray(index: number): Point3 {
    const tray = this.anchors.trays[index];
    if (tray === undefined) {
      throw new Error(`No machine ${index}`);
    }
    return tray;
  }
}
