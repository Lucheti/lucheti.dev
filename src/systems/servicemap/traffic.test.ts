import { describe, expect, it } from "vitest";
import { SeededRandom, type RandomSource } from "../queue/RandomSource";
import { Emitter } from "./Emitter";
import { FlightPool } from "./FlightPool";
import { Latency } from "./Latency";
import { QueueBacklog } from "./QueueBacklog";
import { ServiceBag } from "./ServiceBag";
import { Spike } from "./Spike";
import { EdgeBook, queueConsumers } from "./topology";

describe("Spike", () => {
  const shape = { peak: 4, riseMs: 1000, holdMs: 2000, fallMs: 1000 } as const;

  it("rises from 1 to its peak, holds, and falls back to 1", () => {
    const spike = new Spike(shape);
    expect(spike.multiplier(0)).toBe(1);
    spike.start(1000);
    expect(spike.multiplier(1000)).toBe(1);
    expect(spike.multiplier(1500)).toBeCloseTo(2.5, 5);
    expect(spike.multiplier(2500)).toBe(4);
    expect(spike.multiplier(4500)).toBeCloseTo(2.5, 5);
    expect(spike.running(4999)).toBe(true);
    expect(spike.multiplier(5000)).toBe(1);
    expect(spike.running(5000)).toBe(false);
  });

  it("runs one at a time", () => {
    const spike = new Spike(shape);
    expect(spike.start(0)).toBe(true);
    expect(spike.start(1000)).toBe(false);
    expect(spike.start(4000)).toBe(true);
  });

  it("refuses a spike that lowers traffic or takes no time", () => {
    expect(() => new Spike({ ...shape, peak: 0.5 })).toThrow();
    expect(() => new Spike({ ...shape, holdMs: 0 })).toThrow();
  });
});

describe("QueueBacklog", () => {
  it("grows while more arrives than is drained, drains after, and never goes below empty", () => {
    const backlog = new QueueBacklog(1000);
    backlog.advance(2000, 300, 100);
    expect(backlog.waiting()).toBe(400);
    expect(backlog.fill()).toBeCloseTo(0.4, 5);
    backlog.advance(1000, 0, 100);
    expect(backlog.waiting()).toBe(300);
    backlog.advance(10_000, 0, 100);
    expect(backlog.waiting()).toBe(0);
  });

  it("caps its bar at full", () => {
    const backlog = new QueueBacklog(100);
    backlog.advance(1000, 500, 0);
    expect(backlog.fill()).toBe(1);
  });
});

describe("Latency", () => {
  it("heads for a higher p95 under load and settles back after", () => {
    const latency = new Latency(40, 1, 1000);
    latency.advance(1000, 3);
    expect(latency.p95()).toBeGreaterThan(80);
    expect(latency.p95()).toBeLessThan(120);
    latency.advance(20_000, 3);
    expect(latency.p95()).toBe(120);
    expect(latency.settled(0.05)).toBe(false);
    latency.advance(20_000, 1);
    expect(latency.p95()).toBe(40);
    expect(latency.settled(0.05)).toBe(true);
  });
});

/** Always the same number. */
class FixedRandom implements RandomSource {
  public constructor(private readonly value: number) {}

  public next(): number {
    return this.value;
  }
}

describe("Emitter", () => {
  it("sends the first dot at once, then one per period at its rate", () => {
    const emitter = new Emitter(new FixedRandom(0.5), 0.3);
    expect(emitter.advance(16, 2)).toBe(1);
    expect(emitter.advance(480, 2)).toBe(0);
    expect(emitter.advance(20, 2)).toBe(1);
    expect(emitter.advance(1000, 2)).toBe(2);
  });

  it("holds the stream at a rate of zero", () => {
    const emitter = new Emitter(new FixedRandom(0.5), 0);
    expect(emitter.advance(5000, 0)).toBe(0);
  });
});

describe("ServiceBag", () => {
  it("deals every service its share in each bag", () => {
    const bag = new ServiceBag({ orders: 3, payments: 2, inventory: 3 }, new SeededRandom(5));
    const dealt = Array.from({ length: 16 }, () => bag.next());
    expect(dealt.filter((service) => service === "payments")).toHaveLength(4);
    expect(dealt.slice(0, 8).filter((service) => service === "orders")).toHaveLength(3);
    expect(bag.share("payments")).toBe(0.25);
  });

  it("refuses a service with no share", () => {
    expect(() => new ServiceBag({ orders: 0, payments: 1, inventory: 1 }, new SeededRandom(1))).toThrow();
  });
});

describe("FlightPool", () => {
  const edges = new EdgeBook();

  it("moves dots along and hands over each one that arrives", () => {
    const pool = new FlightPool(4, 1);
    pool.launch(edges.entry(), "request", 100);
    const arrived: string[] = [];
    pool.advance(60, (arrival) => arrived.push(arrival.edge.kind));
    expect(pool.views()[0].progress()).toBeCloseTo(0.6, 5);
    pool.advance(60, (arrival) => arrived.push(arrival.edge.kind));
    expect(arrived).toEqual(["entry"]);
    expect(pool.flying()).toBe(0);
  });

  it("keeps its reserve for retries and test requests", () => {
    const pool = new FlightPool(3, 1);
    expect(pool.launch(edges.entry(), "request", 100)).toBe(true);
    expect(pool.launch(edges.entry(), "request", 100)).toBe(true);
    expect(pool.launch(edges.entry(), "request", 100)).toBe(false);
    expect(pool.launch(edges.route("orders"), "probe", 100)).toBe(true);
    expect(pool.launch(edges.route("orders"), "retry", 100, 2)).toBe(false);
  });

  it("starts a dot launched on arrival on the next step", () => {
    const pool = new FlightPool(4, 0);
    pool.launch(edges.entry(), "request", 100);
    pool.advance(100, () => pool.launch(edges.route("payments"), "request", 100));
    expect(pool.views().find((view) => view.flying())?.progress()).toBe(0);
  });
});

describe("topology", () => {
  it("has every service drain the queue, and books each edge once", () => {
    expect(queueConsumers()).toEqual(["orders", "payments", "inventory"]);
    const book = new EdgeBook();
    expect(book.all()).toHaveLength(9);
    expect(book.route("orders")).toBe(book.route("orders"));
    expect(book.store("inventory", "redis")).toEqual({ kind: "store", service: "inventory", store: "redis" });
    expect(() => book.store("payments", "redis")).toThrow();
  });
});
