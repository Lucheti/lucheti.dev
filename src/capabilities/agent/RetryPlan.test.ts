import { describe, expect, it } from "vitest";
import { RetryPlan } from "./RetryPlan";

describe("RetryPlan", () => {
  it("lets the first ticket through cleanly", () => {
    for (let seed = 0; seed < 40; seed += 1) {
      expect(new RetryPlan(seed).retries(0)).toBe(false);
    }
  });

  it("retries exactly one ticket in each block of four", () => {
    const plan = new RetryPlan(2026);
    for (let block = 0; block < 50; block += 1) {
      const retries = Array.from({ length: 4 }, (_, slot) => plan.retries(block * 4 + slot));
      expect(retries.filter(Boolean)).toHaveLength(1);
    }
  });

  it("is the same for the same seed and varies the place between blocks", () => {
    const a = new RetryPlan(9);
    const b = new RetryPlan(9);
    const places = new Set<number>();
    for (let episode = 0; episode < 80; episode += 1) {
      expect(a.retries(episode)).toBe(b.retries(episode));
      if (a.retries(episode)) {
        places.add(episode % 4);
      }
    }
    expect(places.size).toBeGreaterThan(1);
  });

  it("refuses an episode that is not a count", () => {
    expect(() => new RetryPlan(1).retries(-1)).toThrow();
    expect(() => new RetryPlan(1).retries(1.5)).toThrow();
    expect(() => new RetryPlan(1.5)).toThrow();
  });
});
