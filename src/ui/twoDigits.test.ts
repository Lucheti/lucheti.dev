import { describe, expect, it } from "vitest";
import { twoDigits } from "./twoDigits";

describe("twoDigits", () => {
  it("pads single digits", () => {
    expect(twoDigits(0)).toBe("00");
    expect(twoDigits(2)).toBe("02");
  });

  it("leaves two or more digits alone", () => {
    expect(twoDigits(10)).toBe("10");
    expect(twoDigits(123)).toBe("123");
  });
});
