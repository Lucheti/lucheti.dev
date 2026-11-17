import { describe, expect, it } from "vitest";
import { ParcelDrop } from "./ParcelDrop";

describe("ParcelDrop", () => {
  it("drops a new parcel from the spawn height to its rest, faster as it goes", () => {
    const drop = new ParcelDrop(20, 2);
    drop.restAt(1, 0.5);
    drop.step(0.05);
    const first = 2 - drop.height(1);
    drop.restAt(1, 0.5);
    drop.step(0.05);
    const second = 2 - drop.height(1) - first;
    expect(first).toBeGreaterThan(0);
    expect(second).toBeGreaterThan(first);
    expect(drop.falling()).toBe(true);
    for (let frame = 0; frame < 40; frame += 1) {
      drop.restAt(1, 0.5);
      drop.step(0.05);
    }
    expect(drop.height(1)).toBe(0.5);
    expect(drop.falling()).toBe(false);
  });

  it("lets a resting parcel fall again when the one under it leaves", () => {
    const drop = new ParcelDrop(20, 2);
    for (let frame = 0; frame < 40; frame += 1) {
      drop.restAt(7, 1);
      drop.step(0.05);
    }
    drop.restAt(7, 0.7);
    drop.step(0.02);
    expect(drop.height(7)).toBeLessThan(1);
    expect(drop.height(7)).toBeGreaterThan(0.7);
  });

  it("forgets a parcel it is no longer told about", () => {
    const drop = new ParcelDrop(20, 2);
    drop.restAt(3, 0.5);
    drop.step(1);
    drop.step(0.01);
    expect(drop.height(3)).toBe(2);
  });
});
