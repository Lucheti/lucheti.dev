import { describe, expect, it } from "vitest";
import { SITE, type Era, type TimelineMilestone, type TimelineStop } from "@/content";
import { eraBoundary } from "./eraBoundary";
import { splitByEra, timelineEntries } from "./TimelineEntries";
import { TimelineGeometry } from "./TimelineGeometry";

const SEVEN_STOPS = 7;
const AFTER_THIRD = 2;

describe("TimelineGeometry", () => {
  const wide = new TimelineGeometry(1600, SEVEN_STOPS, AFTER_THIRD);
  const narrow = new TimelineGeometry(768, SEVEN_STOPS, AFTER_THIRD);

  it("spaces stops at 38vw, never under 340px", () => {
    expect(wide.spacing()).toBeCloseTo(608);
    expect(narrow.spacing()).toBe(340);
  });

  it("starts the first stop near the reading line", () => {
    expect(wide.stopX(0)).toBeCloseTo(720);
    expect(wide.readingX()).toBeCloseTo(672);
    expect(wide.activeIndex(0)).toBe(0);
  });

  it("travels exactly the distance between the first and last stop", () => {
    expect(wide.travel()).toBeCloseTo(6 * 608);
    expect(wide.trackWidth()).toBeCloseTo(1600 + 6 * 608);
    expect(wide.stopX(6) + wide.xAt(1)).toBeCloseTo(wide.stopX(0));
  });

  it("maps progress to x and back, clamped", () => {
    expect(wide.xAt(0)).toBeCloseTo(0);
    expect(wide.xAt(2)).toBeCloseTo(-wide.travel());
    expect(wide.xAt(-1)).toBeCloseTo(0);
    expect(wide.progressAt(-wide.travel() / 2)).toBeCloseTo(0.5);
    expect(wide.progressAt(500)).toBe(0);
    expect(wide.progressAt(-1e9)).toBe(1);
  });

  it("picks the stop closest to the reading line", () => {
    for (let index = 0; index < SEVEN_STOPS; index += 1) {
      const x = wide.readingX() - wide.stopX(index);
      expect(wide.activeIndex(x)).toBe(index);
    }
    const halfway = wide.readingX() - wide.stopX(1) - wide.spacing() * 0.6;
    expect(wide.activeIndex(halfway)).toBe(2);
  });

  it("places the era turn between the stops it separates", () => {
    expect(wide.eraX()).toBeGreaterThan(wide.stopX(AFTER_THIRD));
    expect(wide.eraX()).toBeLessThan(wide.stopX(AFTER_THIRD + 1));
    expect(wide.eraX()).toBeCloseTo((wide.stopX(2) + wide.stopX(3)) / 2);
  });

  it("places a gap at the midpoint between two stops", () => {
    expect(wide.gapX(0)).toBeCloseTo((wide.stopX(0) + wide.stopX(1)) / 2);
    expect(wide.gapX(SEVEN_STOPS - 2)).toBeCloseTo((wide.stopX(5) + wide.stopX(6)) / 2);
    expect(wide.gapX(AFTER_THIRD)).toBeCloseTo(wide.eraX());
  });

  it("rejects a gap outside the stops", () => {
    expect(() => wide.gapX(-1)).toThrow(RangeError);
    expect(() => wide.gapX(SEVEN_STOPS - 1)).toThrow(RangeError);
    expect(() => wide.gapX(1.5)).toThrow(RangeError);
  });

  it("splits the progress bar at the era turn", () => {
    const era = wide.eraProgress();
    expect(era).toBeGreaterThan(0);
    expect(era).toBeLessThan(1);
    expect(wide.barFill(0)).toEqual({ before: 0, after: 0 });
    expect(wide.barFill(era / 2).after).toBe(0);
    expect(wide.barFill(era / 2).before).toBeCloseTo(0.5);
    expect(wide.barFill(1)).toEqual({ before: 1, after: 1 });
  });

  it("handles a single stop without dividing by zero", () => {
    const single = new TimelineGeometry(1000, 1, 0);
    expect(single.travel()).toBe(0);
    expect(single.progressAt(0)).toBe(0);
    expect(single.barFill(0.5).before).toBe(1);
  });

  it("rejects impossible input", () => {
    expect(() => new TimelineGeometry(0, 3, 0)).toThrow(RangeError);
    expect(() => new TimelineGeometry(800, 0, 0)).toThrow(RangeError);
    expect(() => new TimelineGeometry(800, 3, 3)).toThrow(RangeError);
  });
});

function stopOf(year: string, era: Era): TimelineStop {
  return { year, period: year, company: `Co ${year}`, role: "Engineer", did: "", trend: "", era };
}

function milestoneOf(label: string, afterStop: number): TimelineMilestone {
  return { date: "Jan 2020", kind: "promotion", label, note: "", afterStop };
}

describe("eraBoundary", () => {
  it("returns the index of the last pre-ai stop", () => {
    expect(eraBoundary([{ era: "pre-ai" }, { era: "pre-ai" }, { era: "ai" }])).toBe(1);
    expect(eraBoundary([{ era: "pre-ai" }])).toBe(0);
    expect(eraBoundary([{ era: "pre-ai" }, { era: "ai" }, { era: "ai" }])).toBe(0);
  });

  it("rejects a first stop that is not pre-ai", () => {
    expect(() => eraBoundary([])).toThrow(RangeError);
    expect(() => eraBoundary([{ era: "ai" }, { era: "ai" }])).toThrow(RangeError);
  });

  it("rejects a pre-ai stop after an ai one", () => {
    expect(() => eraBoundary([{ era: "pre-ai" }, { era: "ai" }, { era: "pre-ai" }])).toThrow(RangeError);
  });

  it("finds the era turn in the real content", () => {
    expect(eraBoundary(SITE.timeline.stops)).toBe(2);
  });
});

describe("timelineEntries", () => {
  const stops = [stopOf("2019", "pre-ai"), stopOf("2020", "pre-ai"), stopOf("2023", "ai")];

  it("inserts each milestone right after its stop", () => {
    const entries = timelineEntries(stops, [milestoneOf("A", 0), milestoneOf("B", 1)]);
    expect(entries.map((entry) => (entry.kind === "stop" ? entry.stop.year : entry.milestone.label))).toEqual([
      "2019",
      "A",
      "2020",
      "B",
      "2023",
    ]);
  });

  it("gives a milestone the era of the stop after it", () => {
    const entries = timelineEntries(stops, [milestoneOf("A", 0), milestoneOf("B", 1)]);
    expect(entries.map((entry) => entry.era)).toEqual(["pre-ai", "pre-ai", "pre-ai", "ai", "ai"]);
  });

  it("rejects a milestone outside the gaps between stops", () => {
    expect(() => timelineEntries(stops, [milestoneOf("A", -1)])).toThrow(RangeError);
    expect(() => timelineEntries(stops, [milestoneOf("A", 2)])).toThrow(RangeError);
  });
});

describe("splitByEra", () => {
  it("splits on era, keeping order", () => {
    const stops = [stopOf("2019", "pre-ai"), stopOf("2023", "ai")];
    const { before, after } = splitByEra(timelineEntries(stops, [milestoneOf("A", 0)]));
    expect(before.map((entry) => entry.kind)).toEqual(["stop"]);
    expect(after.map((entry) => entry.kind)).toEqual(["milestone", "stop"]);
  });

  it("puts the Clarifai move first in the ai era of the real content", () => {
    const { stops, milestones } = SITE.timeline;
    const { after } = splitByEra(timelineEntries(stops, milestones));
    const first = after[0];
    expect(first?.kind).toBe("milestone");
    expect(first?.kind === "milestone" && first.milestone.label).toBe("Salesforce → Clarifai");
  });
});
