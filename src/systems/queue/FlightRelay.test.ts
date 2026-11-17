import { describe, expect, it } from "vitest";
import type { FramePainter } from "./FlightPainter";
import { FlightRelay, PainterFan } from "./FlightRelay";
import type { FlightView } from "./types";

const flights: readonly FlightView[] = [{ id: 3, from: { kind: "producer" }, to: { kind: "queue" }, progress: 0.4 }];

describe("FlightRelay", () => {
  it("keeps the latest frame's flights until cleared", () => {
    const relay = new FlightRelay();
    expect(relay.flights()).toEqual([]);
    relay.paint(flights);
    expect(relay.flights()).toBe(flights);
    relay.clear();
    expect(relay.flights()).toEqual([]);
  });
});

describe("PainterFan", () => {
  it("hands every frame and every clear to each painter", () => {
    const calls: string[] = [];
    const painter = (name: string): FramePainter => ({
      paint: (painted) => calls.push(`${name} paint ${painted.length}`),
      clear: () => calls.push(`${name} clear`),
    });
    const fan = new PainterFan([painter("a"), painter("b")]);
    fan.paint(flights);
    fan.clear();
    expect(calls).toEqual(["a paint 1", "b paint 1", "a clear", "b clear"]);
  });

  it("needs a painter", () => {
    expect(() => new PainterFan([])).toThrow();
  });
});
