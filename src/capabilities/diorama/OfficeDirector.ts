import { actionsOf, lookOf, type StationAction, type StationId, type StationLook } from "../office";
import type { CapPoser } from "./CapPoser";
import type { OfficeDioramaParts } from "./composeOfficeDiorama";
import type { FrameInput, FrameResult, IslandRig } from "./kit";
import type { PinKey } from "./OfficeLayout";
import type { RobotPoser } from "./RobotPoser";
import type { StationPoser } from "./StationPoser";
import type { TicketPoser } from "./TicketPoser";

/** Every station's look for what it is doing. */
function looksOf(actions: Readonly<Record<StationId, StationAction>>): Readonly<Record<StationId, StationLook>> {
  return {
    product: lookOf(actions.product),
    design: lookOf(actions.design),
    engineering: lookOf(actions.engineering),
    qa: lookOf(actions.qa),
    release: lookOf(actions.release),
  };
}

/**
 * Runs the office diorama's frames: the rig turns and frames the island, the office floor moves on by the
 * frame's time, and the posers take the frame: the button's cap, the robots, the stations' props and the
 * tickets. Last, the labels are pinned where their points landed.
 */
export class OfficeDirector {
  public constructor(
    private readonly parts: OfficeDioramaParts,
    private readonly rig: IslandRig<PinKey>,
    private readonly cap: CapPoser,
    private readonly robots: RobotPoser,
    private readonly stations: StationPoser,
    private readonly tickets: TicketPoser,
  ) {}

  /** Whether the pointer is over the big button. */
  public hover(over: boolean): void {
    this.cap.hover(over);
  }

  /** Poses everything for this frame. */
  public frame(input: FrameInput): FrameResult {
    const { animate } = input.behaviour;
    const { first, step, turning } = this.rig.frame(input);
    const { office } = this.parts.toy;
    if (animate) {
      office.advance(step);
    }
    const now = this.parts.clock.now();
    const tickets = office.tickets();
    const actions = actionsOf(tickets.map((ticket) => ticket.beat));
    const looks = looksOf(actions);
    const pressing = this.cap.pose(step, animate);
    this.robots.pose(looks, now, animate);
    this.stations.pose(looks, actions, now, step, animate);
    this.tickets.pose(tickets, office.waiting(), now, animate);
    this.rig.pinLabels(input);
    return { first, busy: pressing || turning };
  }
}
