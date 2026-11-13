import { describe, expect, it } from "vitest";
import { rhythmFor } from "./ActivityRhythm";

const rows = Array.from({ length: 24 }, (_, index) => rhythmFor(index));

describe("rhythmFor", () => {
  it("is stable for a given row", () => {
    expect(rhythmFor(5)).toEqual(rhythmFor(5));
  });

  it("keeps every timing in its range", () => {
    rows.forEach((rhythm) => {
      expect(rhythm.fill).toBeGreaterThanOrEqual(1.6);
      expect(rhythm.fill).toBeLessThanOrEqual(3.4);
      expect(rhythm.delay).toBeLessThanOrEqual(0);
      expect(rhythm.delay).toBeGreaterThan(-rhythm.fill);
      expect(rhythm.still).toBeGreaterThan(0);
      expect(rhythm.still).toBeLessThan(1);
    });
  });

  it("gives neighbouring rows, such as parallel workers, different speeds", () => {
    for (let index = 1; index < rows.length; index += 1) {
      expect(Math.abs(rows[index].fill - rows[index - 1].fill)).toBeGreaterThan(0.2);
    }
  });
});
