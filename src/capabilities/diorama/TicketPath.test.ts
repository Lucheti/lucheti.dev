import { describe, expect, it } from "vitest";
import type { Beat, Leg } from "../office";
import { OfficeLayout } from "./OfficeLayout";
import { TicketPath } from "./TicketPath";

const spots = new OfficeLayout().spots();
const path = new TicketPath(spots, { hop: 0.6, deskHop: 0.35, bounceHop: 0.95, share: 0.6, facing: 0.6 });
const beat = (leg: Leg, progress: number): Beat => ({ leg, index: 1, progress });

describe("TicketPath", () => {
  it("slides the card from the inbox onto Product's desk, and stamps it partway through", () => {
    const [start] = path.place({ leg: { kind: "stamp" }, index: 0, progress: 0 });
    const [stamped] = path.place({ leg: { kind: "stamp" }, index: 0, progress: 0.5 });
    expect(start.at).toEqual(spots.inbox);
    expect(start.stamped).toBe(false);
    expect(stamped.at).toEqual(spots.product);
    expect(stamped.stamped).toBe(true);
    expect(stamped.flat).toBe(1);
  });

  it("flies a card in a hop from one station to the next, standing up on the way", () => {
    const leg: Leg = { kind: "travel", from: "design", to: "engineering" };
    const [from] = path.place(beat(leg, 0));
    const [middle] = path.place(beat(leg, 0.5));
    const [to] = path.place(beat(leg, 1));
    expect(from.at).toEqual(spots.design);
    expect(to.at).toEqual(spots.hub);
    expect(middle.at.y).toBeGreaterThan(Math.max(spots.design.y, spots.hub.y));
    expect(middle.flat).toBe(0);
  });

  it("splits into three smaller cards that reach the engineers' desks, and joins them again", () => {
    const apart = path.place(beat({ kind: "type" }, 0.5));
    expect(apart).toHaveLength(3);
    apart.forEach((card, desk) => {
      expect(card.at.x).toBeCloseTo(spots.desks[desk].x, 6);
      expect(card.at.y).toBeCloseTo(spots.desks[desk].y, 6);
      expect(card.at.z).toBeCloseTo(spots.desks[desk].z, 6);
      expect(card.scale).toBeCloseTo(0.6, 6);
    });
    const joined = path.place(beat({ kind: "join" }, 1));
    joined.forEach((card) => {
      expect(card.at.x).toBeCloseTo(spots.hub.x, 6);
      expect(card.scale).toBeCloseTo(1, 6);
    });
  });

  it("turns a card QA sent back red and bounces it back to Engineering", () => {
    const [red] = path.place(beat({ kind: "verdict", pass: false }, 0.5));
    const [green] = path.place(beat({ kind: "verdict", pass: true }, 0.5));
    expect(red.bounced).toBe(true);
    expect(green.bounced).toBe(false);
    const [landed] = path.place(beat({ kind: "bounce" }, 1));
    expect(landed.at.x).toBeCloseTo(spots.hub.x, 6);
    expect(landed.at.z).toBeCloseTo(spots.hub.z, 6);
    const [high] = path.place(beat({ kind: "bounce" }, 0.37));
    expect(high.at.y).toBeGreaterThan(spots.hub.y);
  });

  it("puts the card into the rocket, and shows none once it is aboard", () => {
    const [boarding] = path.place(beat({ kind: "launch" }, 0.05));
    expect(boarding.scale).toBeLessThan(1);
    expect(path.place(beat({ kind: "launch" }, 0.5))).toHaveLength(0);
  });
});
