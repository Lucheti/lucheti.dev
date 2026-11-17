import { describe, expect, it } from "vitest";
import { allTargets, sameTarget, STAR_COUNT, targetKey } from "./Target";

describe("Target", () => {
  it("lists every target once, each star by its count", () => {
    const keys = allTargets().map(targetKey);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.filter((key) => key.startsWith("star-"))).toHaveLength(STAR_COUNT);
    expect(keys).toContain("card");
  });

  it("tells targets apart, the stars by their count", () => {
    expect(sameTarget({ kind: "star", count: 2 }, { kind: "star", count: 2 })).toBe(true);
    expect(sameTarget({ kind: "star", count: 2 }, { kind: "star", count: 3 })).toBe(false);
    expect(sameTarget({ kind: "duck" }, null)).toBe(false);
  });
});
