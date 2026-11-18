import { assertNever } from "../office/assertNever";
import type { Beat, StationId } from "../office";
import { arc, lerp, offset, type Point3 } from "./kit";
import type { TicketSpots } from "./OfficeLayout";

/** One ticket card at one moment: where, how big, how far it is laid down, its turn, and what is on it. */
export type CardPlace = Readonly<{
  at: Point3;
  scale: number;
  /** 0 standing up to face the camera, 1 lying flat on a desk. */
  flat: number;
  /** Its turn about the upright, in radians. */
  spin: number;
  /** Whether Product's stamp is on it. */
  stamped: boolean;
  /** Whether QA has turned it down: it goes red until it is built again. */
  bounced: boolean;
}>;

/** How the cards fly. */
export type PathRules = Readonly<{
  /** How high a card is thrown above the higher end of a trip between stations, and of a trip to a desk and back. */
  hop: number;
  deskHop: number;
  /** How high a card QA turned down is thrown back. */
  bounceHop: number;
  /** The size of each engineer's share of a ticket, as a share of the whole card. */
  share: number;
  /** The turn that faces the camera. */
  facing: number;
}>;

/** When in the stamp the rubber meets the card. */
const STAMPED_AT = 0.42;
/** How long the first share of a stamp the card slides from the inbox onto the desk. */
const SLIDE = 0.2;
/** How long the first share of the launch the card takes to board the rocket. */
const BOARD = 0.15;

function smooth(value: number): number {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

/**
 * Where a ticket's card is for its beat, as a pure function: it slides from the inbox onto Product's desk
 * and is stamped, flies in a hop from station to station turning as it goes, stands by the easel while it
 * is sketched, splits into three smaller cards that fly to the engineers' desks and back, lies under QA's
 * magnifier, goes red and bounces back to Engineering when QA turns it down, and boards the rocket.
 */
export class TicketPath {
  public constructor(
    private readonly spots: TicketSpots,
    private readonly rules: PathRules,
  ) {}

  /** The cards a ticket shows for `beat`: one, three while it is split, none once it is in the rocket. */
  public place(beat: Beat): readonly CardPlace[] {
    const { leg, progress } = beat;
    const stamped = beat.index > 0 || progress >= STAMPED_AT;
    const card = (at: Point3, flat: number, spin = this.rules.facing, bounced = false, scale = 1): CardPlace => ({
      at,
      scale,
      flat,
      spin,
      stamped,
      bounced,
    });
    switch (leg.kind) {
      case "stamp": {
        const slide = smooth(progress / SLIDE);
        return [card(arc(this.spots.inbox, this.spots.product, 0.15, slide), 1)];
      }
      case "travel": {
        const t = smooth(progress);
        const from = this.spotOf(leg.from);
        const to = this.spotOf(leg.to);
        const flat = this.flatAt(leg.from) * (1 - smooth(progress / 0.25)) + this.flatAt(leg.to) * smooth((progress - 0.75) / 0.25);
        // A sway rather than a full turn, so the card never shows its thin edge to the camera.
        return [card(arc(from, to, this.rules.hop, t), flat, this.rules.facing + Math.sin(t * Math.PI * 2) * 0.45)];
      }
      case "sketch":
      case "inspect":
        return [card(this.spotOf(leg.kind === "sketch" ? "design" : "qa"), leg.kind === "sketch" ? 0 : 1)];
      case "verdict":
        return [card(this.spots.qa, 1, this.rules.facing, !leg.pass)];
      case "split":
        return this.shares(smooth(progress));
      case "type":
        return this.shares(1);
      case "join":
        return this.shares(1 - smooth(progress));
      case "bounce": {
        // One big hop most of the way back, then a small one onto the spot.
        const at =
          progress < 0.75
            ? arc(this.spots.qa, lerp(this.spots.qa, this.spots.hub, 0.82), this.rules.bounceHop, smooth(progress / 0.75))
            : arc(lerp(this.spots.qa, this.spots.hub, 0.82), this.spots.hub, this.rules.bounceHop * 0.3, (progress - 0.75) / 0.25);
        const flat = 1 - smooth(progress / 0.3);
        return [card(at, flat, this.rules.facing - Math.sin(progress * Math.PI * 3) * 0.6, true)];
      }
      case "launch": {
        if (progress >= BOARD) {
          return [];
        }
        const t = smooth(progress / BOARD);
        return [card(lerp(this.spots.rocket, offset(this.spots.rocket, 0, 0, -0.18), t), 0, this.rules.facing, false, 1 - t)];
      }
      default:
        return assertNever(leg);
    }
  }

  /** The three shares of a split ticket, `apart` of the way from the hub to the desks. */
  private shares(apart: number): readonly CardPlace[] {
    return this.spots.desks.map((desk) => ({
      at: arc(this.spots.hub, desk, this.rules.deskHop, apart),
      scale: 1 - (1 - this.rules.share) * apart,
      flat: apart,
      spin: this.rules.facing,
      stamped: true,
      bounced: false,
    }));
  }

  /** Where the ticket is at a station. */
  private spotOf(station: StationId): Point3 {
    switch (station) {
      case "product":
        return this.spots.product;
      case "design":
        return this.spots.design;
      case "engineering":
        return this.spots.hub;
      case "qa":
        return this.spots.qa;
      case "release":
        return this.spots.rocket;
      default:
        return assertNever(station);
    }
  }

  /** Whether the ticket lies flat at a station (on a desk) or stands up (by the easel, the hub, the rocket). */
  private flatAt(station: StationId): number {
    return station === "product" || station === "qa" ? 1 : 0;
  }
}
