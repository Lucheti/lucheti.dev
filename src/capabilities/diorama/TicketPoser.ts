import type { TicketAt } from "../office";
import { offset, popIn, type Point3 } from "./kit";
import type { OfficeModel } from "./OfficeModel";
import type { TicketPath } from "./TicketPath";

/** A card's two looks: the glowing sunny ticket, and the red of one QA turned down. */
export type CardColours = Readonly<{ fresh: Readonly<{ color: string; glow: string }>; bounced: Readonly<{ color: string; glow: string }> }>;

/** How far apart the waiting ideas stack in the tray. */
const STACK = 0.045;

/**
 * Poses the tickets: each one on the floor along its path (split into three while it is built), standing
 * cards bobbing gently where they wait; and the ideas waiting in Product's inbox as a small stack, the
 * newest popping in on top.
 */
export class TicketPoser {
  private lastWaiting = 0;
  private changedAt = Number.NEGATIVE_INFINITY;

  public constructor(
    private readonly model: OfficeModel,
    private readonly path: TicketPath,
    private readonly colours: CardColours,
    private readonly inbox: Point3,
    /** How many waiting ideas the tray draws. */
    private readonly shown: number,
  ) {}

  /** Poses the tickets on the floor and the `waiting` ideas at `now` (seconds). */
  public pose(tickets: readonly TicketAt[], waiting: number, now: number, animate: boolean): void {
    const pool = this.model.tickets();
    pool.begin();
    for (const ticket of tickets) {
      for (const card of this.path.place(ticket.beat)) {
        const bob = animate && card.flat < 0.5 ? 0.025 * Math.sin(now * 2.6 + ticket.serial) : 0;
        const look = card.bounced ? this.colours.bounced : this.colours.fresh;
        pool.place({ ...card, at: offset(card.at, 0, bob, 0), color: look.color, glow: look.glow });
      }
    }
    pool.end();

    if (waiting > this.lastWaiting) {
      this.changedAt = now;
    }
    this.lastWaiting = waiting;
    const tray = this.model.tray();
    tray.begin();
    const stacked = Math.min(waiting, this.shown);
    for (let slot = 0; slot < stacked; slot += 1) {
      const top = slot === stacked - 1;
      const scale = top && animate ? popIn(now - this.changedAt) : 1;
      tray.place({
        at: offset(this.inbox, 0, slot * STACK, 0),
        scale,
        flat: 1,
        spin: ((slot * 37) % 7) * 0.05 - 0.15,
        stamped: false,
        color: this.colours.fresh.color,
        glow: this.colours.fresh.glow,
      });
    }
    tray.end();
  }
}
