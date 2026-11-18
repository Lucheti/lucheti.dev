import { describe, expect, it } from "vitest";
import { ManualClock } from "../queue/Clock";
import { SeededRandom } from "../queue/RandomSource";
import { buildSimulation } from "./buildSimulation";
import { mapConfig } from "./mapConfig";
import type { ServiceMapSimulation } from "./ServiceMapSimulation";
import { EdgeBook } from "./topology";
import type { MapEvent } from "./types";

type Rig = Readonly<{ sim: ServiceMapSimulation; clock: ManualClock }>;

function rig(seed = 7): Rig {
  const clock = new ManualClock();
  return { sim: buildSimulation(mapConfig(), clock, new SeededRandom(seed), new EdgeBook()), clock };
}

/** Runs `ms` in 16 ms frames; returns the events with the time each was taken. */
function run({ sim, clock }: Rig, ms: number): readonly Readonly<{ at: number; event: MapEvent }>[] {
  const seen: { at: number; event: MapEvent }[] = [];
  for (let t = 0; t < ms; t += 16) {
    clock.advance(16);
    sim.update();
    for (const event of sim.takeEvents()) {
      seen.push({ at: clock.now(), event });
    }
  }
  return seen;
}

const flying = (sim: ServiceMapSimulation): number => sim.flights().filter((flight) => flight.flying()).length;

describe("ServiceMapSimulation", () => {
  it("keeps requests flowing in steady traffic, with every service healthy and every breaker closed", () => {
    const map = rig();
    expect(run(map, 20_000)).toEqual([]);
    const snapshot = map.sim.snapshot();
    expect(flying(map.sim)).toBeGreaterThan(0);
    expect(snapshot.services.every((service) => service.health === "up" && service.breaker === "closed")).toBe(true);
    expect(snapshot.gateway.failing).toBe(false);
    expect(snapshot.stores.nats).toEqual({ kind: "queued", n: 0 });
    expect(snapshot.incidents).toBe(0);
  });

  it("is the same run for the same seed", () => {
    const a = rig(3);
    const b = rig(3);
    run(a, 5000);
    run(b, 5000);
    expect(a.sim.snapshot()).toEqual(b.sim.snapshot());
  });

  it("takes a service down, opens its breaker, probes it half-open and closes once it is back, in that order", () => {
    const map = rig();
    run(map, 2000);
    expect(map.sim.takeDown("payments")).toBe(true);
    const story = [{ at: map.clock.now(), event: map.sim.takeEvents()[0] }, ...run(map, 16_000)];
    const kinds = story.map(({ event }) => event.kind);
    expect(kinds).toEqual(["down", "opened", "probing", "back"]);
    const [down, opened, probing, back] = story.map(({ at }) => at);
    expect(opened - down).toBeLessThan(6000);
    expect(probing - opened).toBeGreaterThanOrEqual(3000);
    expect(back - down).toBeLessThan(12_000);
    expect(story.every(({ event }) => event.kind === "spike" || event.kind === "settled" || event.service === "payments")).toBe(true);
    const payments = map.sim.snapshot().services.find((service) => service.id === "payments");
    expect(payments).toMatchObject({ health: "up", breaker: "closed" });
  });

  it("shows the service down and the breaker open while it is out, and fails requests fast at the gateway", () => {
    const map = rig();
    run(map, 1000);
    map.sim.takeDown("orders");
    const events = run(map, 6000).map(({ event }) => event.kind);
    expect(events).toContain("opened");
    const snapshot = map.sim.snapshot();
    const orders = snapshot.services.find((service) => service.id === "orders");
    expect(orders?.breaker).not.toBe("closed");
    expect(snapshot.gateway.failing).toBe(true);
    expect(snapshot.gateway.metric.kind).toBe("failed-fast");
    expect(snapshot.gateway.metric.n).toBeGreaterThan(0);
    expect(snapshot.incidents).toBe(1);
  });

  it("will not take down a service that is already out", () => {
    const map = rig();
    expect(map.sim.takeDown("inventory")).toBe(true);
    expect(map.sim.takeDown("inventory")).toBe(false);
  });

  it("fills the queue and lifts p95 in a spike, then drains and settles", () => {
    const map = rig();
    run(map, 3000);
    const calm = map.sim.snapshot().services.map((service) => service.metric.n);
    expect(map.sim.spike()).toBe(true);
    expect(map.sim.spike()).toBe(false);
    run(map, 6500);
    const peak = map.sim.snapshot();
    expect(peak.spiking).toBe(true);
    expect(peak.queueFill).toBeGreaterThan(0.4);
    expect(peak.queueFill).toBeLessThan(1);
    peak.services.forEach((service, index) => expect(service.metric.n).toBeGreaterThan(calm[index] * 2));
    const events = run(map, 14_000).map(({ event }) => event.kind);
    expect(events).toEqual(["settled"]);
    const after = map.sim.snapshot();
    expect(after.spiking).toBe(false);
    expect(after.queueFill).toBe(0);
  });

  it("never draws more dots than its pool, even in a spike", () => {
    const map = rig();
    map.sim.spike();
    let most = 0;
    for (let t = 0; t < 8000; t += 16) {
      map.clock.advance(16);
      map.sim.update();
      most = Math.max(most, flying(map.sim));
    }
    expect(most).toBeLessThanOrEqual(mapConfig().pool.size);
    expect(most).toBeGreaterThan(8);
  });
});
