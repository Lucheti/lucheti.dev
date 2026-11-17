import { describe, expect, it } from "vitest";
import { ServiceMotion } from "./ServiceMotion";
import { puffsAt } from "./Smoke";

describe("ServiceMotion", () => {
  it("times each status from the moment it was first seen", () => {
    const motion = new ServiceMotion();
    motion.observe([{ kind: "healthy", processed: 0 }], 1);
    motion.observe([{ kind: "busy", processed: 0 }], 2);
    motion.observe([{ kind: "busy", processed: 0 }], 2.5);
    expect(motion.inStatus(0, 3)).toBe(1);
  });

  it("marks when a machine finishes a message", () => {
    const motion = new ServiceMotion();
    motion.observe([{ kind: "healthy", processed: 4 }], 1);
    expect(motion.sinceFinished(0, 1)).toBe(Number.POSITIVE_INFINITY);
    motion.observe([{ kind: "healthy", processed: 5 }], 2);
    expect(motion.sinceFinished(0, 2.25)).toBe(0.25);
  });

  it("marks the moment a restart comes back healthy, and only that", () => {
    const motion = new ServiceMotion();
    motion.observe([{ kind: "busy", processed: 0 }], 0);
    motion.observe([{ kind: "healthy", processed: 0 }], 1);
    expect(motion.sinceBack(0, 1)).toBe(Number.POSITIVE_INFINITY);
    motion.observe([{ kind: "down", processed: 0 }], 2);
    motion.observe([{ kind: "restarting", processed: 0 }], 3);
    motion.observe([{ kind: "healthy", processed: 0 }], 4);
    expect(motion.sinceBack(0, 4.5)).toBe(0.5);
  });

  it("refuses a machine it has not seen", () => {
    expect(() => new ServiceMotion().inStatus(0, 0)).toThrow();
  });
});

describe("puffsAt", () => {
  it("puffs nothing before the machine is down", () => {
    expect(puffsAt(Number.NEGATIVE_INFINITY, 4)).toEqual([]);
    expect(puffsAt(-1, 4)).toEqual([]);
  });

  it("rises puffs in turn, bigger in the first poof", () => {
    const early = puffsAt(0.05, 4);
    const later = puffsAt(4.05, 4);
    expect(early).toHaveLength(4);
    expect(new Set(early.map((puff) => puff.rise.toFixed(3))).size).toBe(4);
    const size = (puffs: readonly { size: number }[]): number => puffs.reduce((sum, puff) => sum + puff.size, 0);
    expect(size(early)).toBeGreaterThan(size(later));
    for (const puff of later) {
      expect(puff.rise).toBeGreaterThanOrEqual(0);
      expect(puff.rise).toBeLessThan(1);
      expect(puff.size).toBeGreaterThan(0);
    }
  });
});
