import { describe, expect, it } from "vitest";
import { CountValue } from "./CountValue";

describe("CountValue", () => {
  it("counts up from zero to the value", () => {
    const count = CountValue.parse("16");
    expect(count?.at(0)).toBe("0");
    expect(count?.at(0.5)).toBe("8");
    expect(count?.at(1)).toBe("16");
  });

  it("never pads with zeros, even when the source does", () => {
    expect(CountValue.parse("7")?.at(1)).toBe("7");
    expect(CountValue.parse("07")?.at(1)).toBe("7");
  });

  it("clamps out-of-range fractions", () => {
    const count = CountValue.parse("3");
    expect(count?.at(-1)).toBe("0");
    expect(count?.at(2)).toBe("3");
  });

  it("declines text that is not a whole number", () => {
    expect(CountValue.parse("16+")).toBeUndefined();
    expect(CountValue.parse("")).toBeUndefined();
  });
});
