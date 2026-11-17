import { describe, expect, it } from "vitest";
import { LabelBoard } from "./LabelBoard";

type FakeStyle = { transform: string; opacity: string; width: string };

/** A stand-in for an element: just a style that counts how often it is written. */
function fakeElement(): { element: HTMLElement; style: FakeStyle; writes: () => number } {
  let count = 0;
  const values: FakeStyle = { transform: "", opacity: "", width: "" };
  const style = new Proxy(values, {
    set(target, key: keyof FakeStyle, value: string) {
      count += 1;
      target[key] = value;
      return true;
    },
  });
  return { element: { style } as unknown as HTMLElement, style: values, writes: () => count };
}

describe("LabelBoard", () => {
  it("pins a label at the column, on whole pixels, its leader reaching back to the anchor", () => {
    const board = new LabelBoard(1);
    const root = fakeElement();
    const leader = fakeElement();
    board.attachRoot(0, root.element);
    board.attachLeader(0, leader.element);
    board.place(0, 120.4, 80.6, 200.2, 0.5);
    expect(root.style.transform).toBe("translate(200px, 81px)");
    expect(root.style.opacity).toBe("0.5");
    expect(leader.style.width).toBe("80px");
  });

  it("writes nothing when nothing changed", () => {
    const board = new LabelBoard(1);
    const root = fakeElement();
    board.attachRoot(0, root.element);
    board.place(0, 10, 10, 50, 1);
    const after = root.writes();
    board.place(0, 10.2, 9.9, 50.1, 0.999);
    expect(root.writes()).toBe(after);
  });

  it("skips a label whose elements are not mounted", () => {
    const board = new LabelBoard(2);
    expect(() => board.place(1, 0, 0, 10, 1)).not.toThrow();
  });
});
