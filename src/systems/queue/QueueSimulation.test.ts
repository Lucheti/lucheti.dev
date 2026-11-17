import { describe, expect, it } from "vitest";
import { ManualClock } from "./Clock";
import { QueueSimulation } from "./QueueSimulation";
import { SeededRandom } from "./RandomSource";
import { QUEUE_CONFIG } from "./queueConfig";
import type { QueueConfig, QueueEvent, QueueSnapshot } from "./types";

type Rig = Readonly<{ clock: ManualClock; sim: QueueSimulation }>;

function rig(config: QueueConfig = QUEUE_CONFIG, seed = 7): Rig {
  const clock = new ManualClock();
  return { clock, sim: new QueueSimulation(clock, new SeededRandom(seed), config) };
}

/** Runs `ms` in 50 ms frames, checking every frame, and returns the events seen. */
function run({ clock, sim }: Rig, ms: number, check?: (snapshot: QueueSnapshot) => void): QueueEvent[] {
  const events: QueueEvent[] = [];
  for (let elapsed = 0; elapsed < ms; elapsed += 50) {
    clock.advance(50);
    sim.update();
    events.push(...sim.takeEvents());
    check?.(sim.snapshot());
  }
  return events;
}

/** Every message produced is in exactly one place. */
function expectAccounted(snapshot: QueueSnapshot): void {
  const atServices = snapshot.services.reduce((sum, service) => sum + service.held, 0);
  expect(snapshot.queued.length + snapshot.flights.length + atServices + snapshot.totals.processed).toBe(
    snapshot.totals.produced,
  );
  const visible = [...snapshot.queued, ...snapshot.flights.map((flight) => flight.id)];
  expect(new Set(visible).size).toBe(visible.length);
}

/** One slow service so loads stay put long enough to inspect. */
function slow(overrides: Partial<QueueConfig["rules"]>, services: number[]): QueueConfig {
  return {
    ...QUEUE_CONFIG,
    rules: { ...QUEUE_CONFIG.rules, workers: 1, workJitter: 0, ...overrides },
    services: services.map((workMs) => ({ workMs })),
  };
}

describe("QueueSimulation", () => {
  it("publishes a steady, slightly irregular flow of about 1.5 messages a second", () => {
    const toy = rig();
    const produced: number[] = [];
    run(toy, 60_000, (snapshot) => produced.push(snapshot.totals.produced));
    const total = produced[produced.length - 1];
    expect(total).toBeGreaterThan(80);
    expect(total).toBeLessThan(100);

    const perSecond = Array.from({ length: 59 }, (_, second) => produced[(second + 1) * 20] - produced[second * 20]);
    expect(Math.min(...perSecond)).toBeGreaterThanOrEqual(1);
    expect(new Set(perSecond).size).toBeGreaterThan(1);
  });

  it("is deterministic for a seed", () => {
    const first = rig(QUEUE_CONFIG, 42);
    const second = rig(QUEUE_CONFIG, 42);
    run(first, 4000);
    run(second, 4000);
    first.sim.send(10);
    second.sim.send(10);
    run(first, 6000);
    run(second, 6000);
    expect(first.sim.snapshot()).toEqual(second.sim.snapshot());
  });

  it("never trips a service on the steady flow alone", () => {
    const toy = rig();
    const events = run(toy, 300_000);
    expect(events).toEqual([]);
    expect(toy.sim.snapshot().totals.restarts).toBe(0);
  });

  it("deals each message to the least-busy healthy service", () => {
    const toy = rig(slow({ limit: 5 }, [200, 20_000, 20_000]));
    toy.sim.holdSteadyFlow();
    toy.sim.send(3);
    run(toy, 2000);
    // One each: ties go to the service dealt to longest ago, and the fast one has finished its own.
    expect(toy.sim.snapshot().services.map((service) => service.held)).toEqual([0, 1, 1]);

    toy.sim.send(1);
    run(toy, 1500);
    const services = toy.sim.snapshot().services;
    expect(services.map((service) => service.processed)).toEqual([2, 0, 0]);
    expect(services.map((service) => service.held)).toEqual([0, 1, 1]);
  });

  it("takes an overloaded service down, hands its messages back, restarts it and drains the backlog", () => {
    const toy = rig(slow({ limit: 2, overloadMs: 1500, downMs: 2500, restartMs: 1300 }, [4000]));
    toy.sim.holdSteadyFlow();
    expect(toy.sim.send(5)).toBe(5);

    const statuses: string[] = [];
    let depthWhileDown = 0;
    const events = run(toy, 40_000, (snapshot) => {
      expectAccounted(snapshot);
      const status = snapshot.services[0].status.kind;
      if (statuses[statuses.length - 1] !== status) {
        statuses.push(status);
      }
      if (status === "restarting") {
        depthWhileDown = Math.max(depthWhileDown, snapshot.queued.length);
      }
      if (status === "healthy" && statuses.includes("down")) {
        // Back from a restart, the broker never deals it past its limit again.
        expect(snapshot.services[0].held + snapshot.services[0].incoming).toBeLessThanOrEqual(2);
      }
    });

    expect(statuses).toEqual(["healthy", "busy", "down", "restarting", "healthy"]);
    expect(events).toEqual([
      { kind: "down", service: 0, returned: 5 },
      { kind: "restarting", service: 0 },
      { kind: "recovered", service: 0 },
      { kind: "settled" },
    ]);
    expect(depthWhileDown).toBe(5);
    const end = toy.sim.snapshot();
    expect(end.totals).toEqual({ produced: 5, processed: 5, restarts: 1 });
    expect(toy.sim.isSettled()).toBe(true);
  });

  it("goes down only after staying over its limit for the overload time", () => {
    const toy = rig(slow({ limit: 2, overloadMs: 1500 }, [4000]));
    toy.sim.holdSteadyFlow();
    toy.sim.send(5);
    let busySince = -1;
    let downAt = -1;
    run(toy, 6000, (snapshot) => {
      const status = snapshot.services[0].status;
      if (status.kind === "busy") {
        busySince = status.since;
      }
      if (status.kind === "down" && downAt < 0) {
        downAt = status.since;
      }
    });
    expect(downAt - busySince).toBeGreaterThanOrEqual(1490);
    expect(downAt - busySince).toBeLessThanOrEqual(1510);
  });

  it("piles messages up in the queue while every service is down, then recovers", () => {
    const toy = rig(slow({ limit: 1, overloadMs: 1500 }, [1000, 1000, 1000]), 3);
    toy.sim.send(9);

    let allDownFrames = 0;
    let depthAtFirst = -1;
    let depthAtLast = -1;
    const events = run(toy, 30_000, (snapshot) => {
      expectAccounted(snapshot);
      const allDown = snapshot.services.every((service) => service.status.kind === "down");
      if (allDown) {
        allDownFrames += 1;
        depthAtFirst = depthAtFirst < 0 ? snapshot.queued.length : depthAtFirst;
        depthAtLast = snapshot.queued.length;
        // Nothing is dealt to a service that is down.
        expect(snapshot.flights.filter((flight) => flight.from.kind === "queue")).toEqual([]);
      }
    });

    expect(events.filter((event) => event.kind === "down")).toHaveLength(3);
    expect(allDownFrames).toBeGreaterThan(10);
    expect(depthAtLast).toBeGreaterThan(depthAtFirst);
    expect(events.filter((event) => event.kind === "recovered")).toHaveLength(3);
    expect(events).toContainEqual({ kind: "settled" });
    expect(toy.sim.snapshot().queued.length).toBeLessThan(3);
  });

  it("deals around a service that is down", () => {
    const toy = rig(slow({ limit: 1, overloadMs: 1500, downMs: 5000 }, [20_000, 300, 300]));
    toy.sim.holdSteadyFlow();
    toy.sim.send(6);
    run(toy, 4000);
    const [down] = toy.sim.snapshot().services;
    expect(down.status.kind).toBe("down");

    toy.sim.send(4);
    run(toy, 1500, (snapshot) => {
      expect(snapshot.flights.some((flight) => flight.to.kind === "service" && flight.to.index === 0)).toBe(false);
    });
  });

  it("never loses a message, however hard it is pushed", () => {
    const toy = rig(QUEUE_CONFIG, 11);
    const random = new SeededRandom(5);
    for (let round = 0; round < 40; round += 1) {
      const clicks = Math.floor(random.next() * 4);
      for (let click = 0; click < clicks; click += 1) {
        toy.sim.send(10);
        run(toy, 150, expectAccounted);
      }
      run(toy, 400 + random.next() * 3000, expectAccounted);
    }
    toy.sim.holdSteadyFlow();
    run(toy, 60_000, expectAccounted);
    const { totals } = toy.sim.snapshot();
    expect(totals.restarts).toBeGreaterThan(0);
    expect(totals.processed).toBe(totals.produced);
    expect(toy.sim.isSettled()).toBe(true);
  });

  it("caps the unfinished work a visitor can send", () => {
    const toy = rig();
    toy.sim.holdSteadyFlow();
    const accepted = Array.from({ length: 8 }, () => toy.sim.send(10));
    expect(accepted.reduce((sum, count) => sum + count, 0)).toBe(QUEUE_CONFIG.burst.maxOutstanding);
    expect(accepted[accepted.length - 1]).toBe(0);
  });

  describe("with the panel's tuning", () => {
    function downsAfter(clicks: number, seed: number): number {
      const toy = rig(QUEUE_CONFIG, seed);
      run(toy, 8000);
      for (let click = 0; click < clicks; click += 1) {
        toy.sim.send(10);
        run(toy, 250);
      }
      return run(toy, 30_000).filter((event) => event.kind === "down").length;
    }

    it("shrugs off one send", () => {
      expect([1, 2, 3, 4, 5, 6].map((seed) => downsAfter(1, seed))).toEqual([0, 0, 0, 0, 0, 0]);
    });

    it("loses a service or two to a few quick sends, and more to a flood", () => {
      const two = [1, 2, 3, 4, 5, 6].map((seed) => downsAfter(2, seed));
      const four = [1, 2, 3, 4, 5, 6].map((seed) => downsAfter(4, seed));
      expect(Math.min(...two)).toBeGreaterThanOrEqual(1);
      expect(four.reduce((sum, downs) => sum + downs, 0)).toBeGreaterThan(two.reduce((sum, downs) => sum + downs, 0));
    });
  });

  it("refuses a configuration it cannot run", () => {
    const clock = new ManualClock();
    const random = new SeededRandom(1);
    expect(() => new QueueSimulation(clock, random, { ...QUEUE_CONFIG, services: [] })).toThrow();
    expect(() => new QueueSimulation(clock, random, { ...QUEUE_CONFIG, stepMs: 0 })).toThrow();
    expect(
      () => new QueueSimulation(clock, random, { ...QUEUE_CONFIG, broker: { ...QUEUE_CONFIG.broker, capacity: 1 } }),
    ).toThrow();
  });
});
