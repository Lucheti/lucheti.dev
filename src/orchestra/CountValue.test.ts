import { describe, expect, it } from "vitest";
import { CountValue } from "./CountValue";

describe("CountValue", () => {
  it("counts up from zeros to the padded value", () => {
    const count = CountValue.parse("16");
    expect(count?.at(0)).toBe("00");
    expect(count?.at(0.5)).toBe("08");
    expect(count?.at(1)).toBe("16");
  });

  it("keeps the leading zero of the source", () => {
    expect(CountValue.parse("07")?.at(1)).toBe("07");
  });

  it("clamps out-of-range fractions", () => {
    const count = CountValue.parse("03");
    expect(count?.at(-1)).toBe("00");
    expect(count?.at(2)).toBe("03");
  });

  it("declines text that is not a whole number", () => {
    expect(CountValue.parse("16+")).toBeUndefined();
    expect(CountValue.parse("")).toBeUndefined();
  });
});
