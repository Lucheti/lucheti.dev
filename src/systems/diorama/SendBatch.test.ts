import { describe, expect, it } from "vitest";
import { SendBatch, type Sender } from "./SendBatch";

describe("SendBatch", () => {
  it("sends its batch each time it fires", () => {
    const sent: number[] = [];
    const sender: Sender = { send: (count) => sent.push(count) };
    const batch = new SendBatch(sender, 10);
    batch.fire();
    batch.fire();
    expect(sent).toEqual([10, 10]);
  });

  it("sends at least one message", () => {
    expect(() => new SendBatch({ send: () => undefined }, 0)).toThrow();
  });
});
