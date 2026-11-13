import type { TimelineStop } from "@/content";

/** The index of the last "pre-ai" stop, after which the era turns to "ai". */
export function eraBoundary(stops: readonly Pick<TimelineStop, "era">[]): number {
  if (stops[0]?.era !== "pre-ai") {
    throw new RangeError("the first stop must be pre-ai");
  }
  let last = 0;
  let turned = false;
  stops.forEach((stop, index) => {
    if (stop.era === "ai") {
      turned = true;
    } else if (turned) {
      throw new RangeError("a pre-ai stop cannot follow an ai stop");
    } else {
      last = index;
    }
  });
  return last;
}
