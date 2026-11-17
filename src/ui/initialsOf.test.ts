import { describe, expect, it } from "vitest";
import { initialsOf } from "./initialsOf";

describe("initialsOf", () => {
  it("takes the first letter of each word, upper-cased", () => {
    expect(initialsOf("Lucas Garcia")).toBe("LG");
    expect(initialsOf("  ada  lovelace ")).toBe("AL");
  });
});
