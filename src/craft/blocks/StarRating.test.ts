import { describe, expect, it } from "vitest";
import { StarRating } from "./StarRating";

describe("StarRating", () => {
  it("lists its stars and clamps the starting value", () => {
    expect(new StarRating(5, 4).stars()).toEqual([1, 2, 3, 4, 5]);
    expect(new StarRating(5, 9).value()).toBe(5);
    expect(new StarRating(5, 0).value()).toBe(1);
    expect(new StarRating(5, 2.6).value()).toBe(3);
  });

  it("refuses a star count that is not a whole number above zero", () => {
    expect(() => new StarRating(0, 1)).toThrow();
    expect(() => new StarRating(2.5, 1)).toThrow();
  });

  it("rates and steps within its range, leaving the original alone", () => {
    const rating = new StarRating(5, 3);
    expect(rating.rate(5).value()).toBe(5);
    expect(rating.step(1).value()).toBe(4);
    expect(rating.step(-9).value()).toBe(1);
    expect(rating.step(9).value()).toBe(5);
    expect(rating.value()).toBe(3);
  });

  it("answers the arrow, Home and End keys, and ignores the rest", () => {
    const rating = new StarRating(5, 3);
    expect(rating.press("ArrowRight")?.value()).toBe(4);
    expect(rating.press("ArrowUp")?.value()).toBe(4);
    expect(rating.press("ArrowLeft")?.value()).toBe(2);
    expect(rating.press("ArrowDown")?.value()).toBe(2);
    expect(rating.press("Home")?.value()).toBe(1);
    expect(rating.press("End")?.value()).toBe(5);
    expect(rating.press("Enter")).toBeNull();
  });

  it("lights stars up to its value, or up to a preview", () => {
    const rating = new StarRating(5, 2);
    expect(rating.stars().map((star) => rating.isLit(star))).toEqual([true, true, false, false, false]);
    expect(rating.stars().map((star) => rating.isLit(star, 4))).toEqual([true, true, true, true, false]);
  });
});
