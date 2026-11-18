import type { AgentTicket, OfficeDepartmentId } from "@/content";

/** A station on the office floor, in the order a ticket passes them. */
export type StationId = OfficeDepartmentId;

/** A ticket's short name: its id and a few words, from the agent panel's tickets. */
export type TicketName = Pick<AgentTicket, "id" | "title">;

/**
 * One step of a ticket's trip through the office:
 * - `stamp`: Product stamps it;
 * - `travel`: it flies from one station to the next;
 * - `sketch`: Design draws it on the easel;
 * - `split`: at Engineering it splits into three cards, one per engineer's desk;
 * - `type`: the three engineers build their parts;
 * - `join`: the three cards come back together;
 * - `inspect`: QA sweeps the magnifier over it;
 * - `verdict`: QA's light goes green, or red when the ticket is sent back;
 * - `bounce`: a ticket QA turned down hops back to Engineering;
 * - `launch`: Release puts it in the rocket, which lifts off and comes back down to its pad.
 */
export type Leg =
  | Readonly<{ kind: "stamp" }>
  | Readonly<{ kind: "travel"; from: StationId; to: StationId }>
  | Readonly<{ kind: "sketch" }>
  | Readonly<{ kind: "split" }>
  | Readonly<{ kind: "type" }>
  | Readonly<{ kind: "join" }>
  | Readonly<{ kind: "inspect" }>
  | Readonly<{ kind: "verdict"; pass: boolean }>
  | Readonly<{ kind: "bounce" }>
  | Readonly<{ kind: "launch" }>;

export type LegKind = Leg["kind"];

/** Where a ticket is at one moment: the step it is on, which step of its route that is, and how far through it. */
export type Beat = Readonly<{ leg: Leg; index: number; progress: number }>;

/** A ticket on the floor at one moment. */
export type TicketAt = Readonly<{ serial: number; name: TicketName; beat: Beat }>;

/** Something worth telling: an idea dropped (or turned away from a full inbox), a ticket sent back, or one shipped. */
export type OfficeEvent =
  | Readonly<{ kind: "dropped" }>
  | Readonly<{ kind: "full" }>
  | Readonly<{ kind: "bounced"; name: TicketName }>
  | Readonly<{ kind: "shipped"; name: TicketName }>;

/** Where the ticket the strip follows is: at (or on its way to) a station, or lifting off from Release. */
export type TicketWhere = Readonly<{ serial: number; name: TicketName; station: StationId }>;

/** What the strip under the island reads, changed only when one of its words does. */
export type OfficeSnapshot = Readonly<{
  revision: number;
  /** Ideas waiting in Product's inbox. */
  waiting: number;
  shipped: number;
  /** The oldest ticket still on its way, and where; null when none is. */
  current: TicketWhere | null;
}>;
