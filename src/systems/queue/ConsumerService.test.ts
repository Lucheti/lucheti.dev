import { describe, expect, it } from "vitest";
import { ConsumerService } from "./ConsumerService";
import { SeededRandom } from "./RandomSource";
import type { ServiceRules } from "./types";

const RULES: ServiceRules = { workers: 2, workJitter: 0, limit: 2, overloadMs: 1000, downMs: 2000, restartMs: 500 };

function service(): ConsumerService {
  return new ConsumerService({ workMs: 500 }, RULES, new SeededRandom(1));
}

function deliver(target: ConsumerService, ids: readonly number[], now: number): void {
  ids.forEach((id) => {
    target.expect();
    target.receive(id, now);
  });
}

describe("ConsumerService", () => {
  it("works on as many messages as it has workers, the rest wait", () => {
    const target = service();
    deliver(target, [1, 2, 3], 0);
    expect(target.step(499)).toEqual([{ kind: "strained" }]);
    expect(target.step(500)).toEqual([
      { kind: "completed", id: 2 },
      { kind: "completed", id: 1 },
      { kind: "relieved" },
    ]);
    expect(target.view().held).toBe(1);
    expect(target.step(1000)).toEqual([{ kind: "completed", id: 3 }]);
    expect(target.isIdle()).toBe(true);
  });

  it("counts messages still on their way towards its limit", () => {
    const target = service();
    target.expect();
    target.expect();
    target.expect();
    expect(target.load()).toBe(3);
    expect(target.step(10)).toEqual([{ kind: "strained" }]);
    expect(target.accepts(3)).toBe(false);
    expect(target.accepts(4)).toBe(true);
  });

  it("goes down after the overload time, hands back every message, restarts and recovers", () => {
    const target = new ConsumerService({ workMs: 10_000 }, RULES, new SeededRandom(1));
    deliver(target, [1, 2, 3, 4], 0);
    expect(target.step(10)).toEqual([{ kind: "strained" }]);
    expect(target.step(1009)).toEqual([]);
    expect(target.step(1010)).toEqual([{ kind: "down", returned: [1, 2, 3, 4] }]);
    expect(target.view()).toMatchObject({ held: 0, status: { kind: "down", since: 1010 } });
    expect(target.accepts(10)).toBe(false);

    expect(target.step(3009)).toEqual([]);
    expect(target.step(3010)).toEqual([{ kind: "restarting" }]);
    expect(target.view().restarts).toBe(1);
    expect(target.step(3510)).toEqual([{ kind: "recovered" }]);
    expect(target.isIdle()).toBe(true);
  });

  it("bounces a message that arrives while it is down", () => {
    const target = new ConsumerService({ workMs: 10_000 }, RULES, new SeededRandom(1));
    deliver(target, [1, 2, 3], 0);
    target.expect();
    target.step(10);
    target.step(1010);
    expect(target.receive(4, 1100)).toBe("bounced");
    expect(target.load()).toBe(0);
  });

  it("refuses a message it was never dealt", () => {
    expect(() => service().receive(1, 0)).toThrow();
  });
});
