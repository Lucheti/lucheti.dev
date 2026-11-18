import { SeededRandom } from "../agent/SeededRandom";
import { IdeaQueue } from "./IdeaQueue";
import { Office } from "./Office";
import { OfficeAnnouncer, type OfficeAnnouncements } from "./OfficeAnnouncer";
import { QaVerdicts } from "./QaVerdicts";
import { RoutePlanner } from "./RoutePlanner";
import type { LegTiming } from "./TicketRoute";
import type { TicketName } from "./types";

/** The office and the voice that reads its events out. */
export type OfficeToy = Readonly<{ office: Office; announcer: OfficeAnnouncer }>;

/** Seconds each step takes: slow enough to follow a ticket round, about twenty seconds door to door. */
export const OFFICE_TIMING: LegTiming = {
  stamp: 1.6,
  travel: 1.2,
  sketch: 2.4,
  split: 0.8,
  type: 2.8,
  join: 0.8,
  inspect: 2.0,
  verdict: 1.2,
  bounce: 1.4,
  launch: 3.4,
};

/** The seed QA's verdicts are drawn from: with it, the second ticket of a visit is the first sent back. */
export const QA_SEED = 16;
/** The chance QA sends a ticket back: about one in four. */
const SEND_BACK = 0.25;
/** Ideas the inbox holds at most. */
const INBOX_LIMIT = 12;
/** How far into its first trip the office already is when it first shows: the first ticket on its way to Design. */
const WARM_UP = 2.2;
const WARM_STEP = 0.05;

/**
 * The composition root of the office's logic: QA's seeded verdicts, the route planner, the inbox and the
 * floor, built once from the tuning here, and moved a little way into its first trip so it never opens on
 * an empty floor.
 */
export function composeOffice(names: readonly TicketName[], announcements: OfficeAnnouncements): OfficeToy {
  const office = new Office(
    new RoutePlanner(OFFICE_TIMING),
    new QaVerdicts(new SeededRandom(QA_SEED), SEND_BACK),
    new IdeaQueue(INBOX_LIMIT),
    names,
    { inFlight: 2, pause: 1.6, margin: 0.4 },
  );
  for (let warmed = 0; warmed < WARM_UP; warmed += WARM_STEP) {
    office.advance(WARM_STEP);
  }
  return { office, announcer: new OfficeAnnouncer(announcements) };
}
