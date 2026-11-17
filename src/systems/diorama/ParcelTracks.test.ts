import { describe, expect, it } from "vitest";
import type { FlightView } from "../queue/types";
import { point } from "./kit";
import { ParcelTracks } from "./ParcelTracks";
import { QueueLayout } from "./QueueLayout";

const anchors = {
  outlet: point(-2, 1, 0),
  beltEnd: point(-1, 1.5, 0),
  mouth: point(0, 2.5, 0),
  spout: point(1, 1, 0),
  trays: [point(2, 1.3, 1), point(3, 1.3, 0), point(4, 1.3, -1)],
};
const tracks = new ParcelTracks(anchors);

function flight(from: FlightView["from"], to: FlightView["to"], progress: number): FlightView {
  return { id: 1, from, to, progress };
}

describe("ParcelTracks", () => {
  it("rides a new message up the belt and tosses it into the hopper's mouth", () => {
    const route = (progress: number) => tracks.place(flight({ kind: "producer" }, { kind: "queue" }, progress));
    expect(route(0)).toEqual({ at: anchors.outlet, returning: false, riding: true });
    expect(route(0.31).at.x).toBeCloseTo(-1.5);
    expect(route(0.62).at).toEqual(anchors.beltEnd);
    expect(route(0.62).riding).toBe(false);
    expect(route(0.8).at.y).toBeGreaterThan(anchors.mouth.y);
    expect(route(1).at.x).toBeCloseTo(anchors.mouth.x);
    expect(route(1).at.y).toBeCloseTo(anchors.mouth.y);
  });

  it("throws a dealt message in an arc from the spout onto its machine's tray", () => {
    const route = (progress: number) => tracks.place(flight({ kind: "queue" }, { kind: "service", index: 1 }, progress));
    expect(route(0).at).toEqual(anchors.spout);
    expect(route(0.5).at.y).toBeGreaterThan(anchors.trays[1].y + 0.3);
    expect(route(1).at.x).toBeCloseTo(anchors.trays[1].x);
    expect(route(1).returning).toBe(false);
  });

  it("throws a handed-back message from the tray back into the mouth, higher, marked as returning", () => {
    const back = tracks.place(flight({ kind: "service", index: 2 }, { kind: "queue" }, 0.5));
    const dealt = tracks.place(flight({ kind: "queue" }, { kind: "service", index: 2 }, 0.5));
    expect(back.returning).toBe(true);
    expect(back.at.y).toBeGreaterThan(dealt.at.y);
    expect(tracks.place(flight({ kind: "service", index: 2 }, { kind: "queue" }, 0)).at).toEqual(anchors.trays[2]);
  });

  it("keeps the island's own tracks on the island", () => {
    const layout = new QueueLayout();
    const own = new ParcelTracks(layout.tracks());
    const { min, max } = layout.extent();
    for (let step = 0; step <= 20; step += 1) {
      for (const at of [
        own.place(flight({ kind: "producer" }, { kind: "queue" }, step / 20)).at,
        own.place(flight({ kind: "queue" }, { kind: "service", index: 0 }, step / 20)).at,
        own.place(flight({ kind: "service", index: 2 }, { kind: "queue" }, step / 20)).at,
      ]) {
        expect(at.x).toBeGreaterThanOrEqual(min.x);
        expect(at.x).toBeLessThanOrEqual(max.x);
        expect(at.y).toBeGreaterThanOrEqual(0);
        expect(at.y).toBeLessThanOrEqual(max.y);
      }
    }
  });
});
