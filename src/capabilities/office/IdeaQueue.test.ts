import { describe, expect, it } from "vitest";
import { IdeaQueue } from "./IdeaQueue";

describe("IdeaQueue", () => {
  it("holds dropped ideas up to its limit and hands them out oldest first", () => {
    const inbox = new IdeaQueue(3);
    expect(inbox.empty()).toBe(true);
    expect([inbox.drop(), inbox.drop(), inbox.drop(), inbox.drop()]).toEqual([true, true, true, false]);
    expect(inbox.count()).toBe(3);
    expect(inbox.take()).toBe(true);
    expect(inbox.count()).toBe(2);
    inbox.take();
    inbox.take();
    expect(inbox.take()).toBe(false);
    expect(inbox.empty()).toBe(true);
  });

  it("counts what the tray cannot draw for the +N tag", () => {
    const inbox = new IdeaQueue(10);
    for (let drop = 0; drop < 7; drop += 1) {
      inbox.drop();
    }
    expect(inbox.overflow(4)).toBe(3);
    expect(inbox.overflow(9)).toBe(0);
  });

  it("holds at least one idea", () => {
    expect(() => new IdeaQueue(0)).toThrow();
  });
});
