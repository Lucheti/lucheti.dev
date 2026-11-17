import { describe, expect, it } from "vitest";
import { GenerationHistory, type Generation } from "./Generation";

function make(id: number, seed: number, subject: "lighthouse" | "city" = "lighthouse"): Generation {
  return { id, seed, chips: { subject, mood: "dusk", framing: "wide" } };
}

describe("GenerationHistory", () => {
  it("keeps the newest first", () => {
    const history = GenerationHistory.empty(4).with(make(1, 1)).with(make(2, 2));
    expect(history.list().map((item) => item.id)).toEqual([2, 1]);
  });

  it("drops the oldest beyond its limit", () => {
    let history = GenerationHistory.empty(3);
    for (let i = 1; i <= 5; i += 1) {
      history = history.with(make(i, i));
    }
    expect(history.list().map((item) => item.id)).toEqual([5, 4, 3]);
  });

  it("moves a repeated picture to the front instead of duplicating it", () => {
    const history = GenerationHistory.empty(4).with(make(1, 1)).with(make(2, 2)).with(make(3, 1));
    expect(history.list().map((item) => item.id)).toEqual([3, 2]);
  });

  it("tells pictures apart by their chips", () => {
    const history = GenerationHistory.empty(4).with(make(1, 1)).with(make(2, 1, "city"));
    expect(history.list()).toHaveLength(2);
  });

  it("does not change the history it was called on", () => {
    const base = GenerationHistory.empty(2);
    base.with(make(1, 1));
    expect(base.list()).toHaveLength(0);
  });

  it("refuses a history that keeps nothing", () => {
    expect(() => GenerationHistory.empty(0)).toThrow();
  });
});
