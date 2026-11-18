/**
 * The Orchestra office's logic, with no rendering: tickets' routes through the stations, Product's inbox,
 * QA's seeded verdicts, the floor that runs them, what each station is doing, and the live-region voice.
 */
export { composeOffice, OFFICE_TIMING, type OfficeToy } from "./composeOffice";
export { IdeaQueue } from "./IdeaQueue";
export { Office } from "./Office";
export {
  actionsOf,
  lookOf,
  ROCKET_CLIMB,
  type QaLight,
  type RobotMood,
  type RocketPose,
  type StationAction,
  type StationLook,
} from "./StationLook";
export { headingOf, stationOf, TicketRoute } from "./TicketRoute";
export type { Beat, Leg, OfficeEvent, OfficeSnapshot, StationId, TicketAt, TicketName } from "./types";
