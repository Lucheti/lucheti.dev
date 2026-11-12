import { describe, expect, it } from "vitest";
import { ZonedClock } from "./ZonedClock";

describe("ZonedClock", () => {
  it("reads the wall-clock time of the zone", () => {
    const clock = new ZonedClock("America/Argentina/Buenos_Aires");
    expect(clock.read(new Date("2026-11-12T22:56:00Z"))).toBe("19:56");
  });

  it("uses a 24-hour clock with a two-digit hour", () => {
    const clock = new ZonedClock("UTC");
    expect(clock.read(new Date("2026-11-12T00:05:00Z"))).toBe("00:05");
  });

  it("rejects an empty or unknown zone", () => {
    expect(() => new ZonedClock(" ")).toThrow();
    expect(() => new ZonedClock("Mars/Olympus")).toThrow();
  });
});
