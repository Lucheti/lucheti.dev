import { TicketRoute, type LegTiming } from "./TicketRoute";
import type { Leg } from "./types";

/** Engineering's round: split into three cards, build in parallel, join again. */
const BUILD: readonly Leg[] = [{ kind: "split" }, { kind: "type" }, { kind: "join" }];

/**
 * Plans a ticket's trip: Product stamps it, it flies to Design to be sketched, on to Engineering to be built
 * by three engineers at once, then to QA. For each time QA turns it down, the light goes red and it hops
 * back to Engineering for another round; once QA passes it, it flies to Release and launches.
 */
export class RoutePlanner {
  public constructor(private readonly timing: LegTiming) {}

  /** The route of a ticket QA sends back `bounces` times. */
  public plan(bounces: number): TicketRoute {
    if (!Number.isInteger(bounces) || bounces < 0) {
      throw new Error(`A ticket is sent back a whole number of times: ${bounces}`);
    }
    const legs: Leg[] = [
      { kind: "stamp" },
      { kind: "travel", from: "product", to: "design" },
      { kind: "sketch" },
      { kind: "travel", from: "design", to: "engineering" },
      ...BUILD,
      { kind: "travel", from: "engineering", to: "qa" },
    ];
    for (let round = 0; round < bounces; round += 1) {
      legs.push({ kind: "inspect" }, { kind: "verdict", pass: false }, { kind: "bounce" }, ...BUILD, { kind: "travel", from: "engineering", to: "qa" });
    }
    legs.push({ kind: "inspect" }, { kind: "verdict", pass: true }, { kind: "travel", from: "qa", to: "release" }, { kind: "launch" });
    return new TicketRoute(legs, this.timing);
  }
}
