import { describe, expect, it } from "vitest";
import { SITE } from "@/content";
import { ManualClock } from "../queue/Clock";
import { SeededRandom } from "../queue/RandomSource";
import { buildSimulation } from "./buildSimulation";
import { MapAnnouncer } from "./MapAnnouncer";
import { mapConfig } from "./mapConfig";
import { MapRunner } from "./MapRunner";
import { EdgeBook } from "./topology";
import type { MapEvent } from "./types";

function runner(): MapRunner {
  const clock = new ManualClock();
  return new MapRunner(buildSimulation(mapConfig(), clock, new SeededRandom(7), new EdgeBook()), clock);
}

describe("MapRunner", () => {
  it("shows a click at once, with no frames running", () => {
    const map = runner();
    let renders = 0;
    const heard: MapEvent[] = [];
    map.subscribe(() => (renders += 1));
    map.listen((events) => heard.push(...events));
    expect(map.takeDown("payments")).toBe(true);
    expect(map.snapshot().services.find((service) => service.id === "payments")?.health).toBe("down");
    expect(renders).toBe(1);
    expect(heard).toEqual([{ kind: "down", service: "payments" }]);
    expect(map.spike()).toBe(true);
    expect(map.snapshot().spiking).toBe(true);
  });

  it("moves the clock by each frame's step and stops telling a listener once it unsubscribes", () => {
    const map = runner();
    let renders = 0;
    const unsubscribe = map.subscribe(() => (renders += 1));
    for (let i = 0; i < 40; i += 1) {
      map.frame(i * 16, 16);
    }
    expect(renders).toBeGreaterThan(0);
    unsubscribe();
    const before = renders;
    map.takeDown("orders");
    expect(renders).toBe(before);
  });
});

describe("MapAnnouncer", () => {
  const announcer = new MapAnnouncer(SITE.systems.map);

  it("names the service in what it says", () => {
    expect(announcer.say({ kind: "down", service: "payments" })).toBe("Payments is down. Requests to it are failing.");
    expect(announcer.say({ kind: "opened", service: "orders" })).toBe("The gateway opened its circuit breaker for Orders.");
    expect(announcer.say({ kind: "back", service: "inventory" })).toBe("Inventory is back.");
  });

  it("says the spike and the calm after it plainly", () => {
    expect(announcer.say({ kind: "spike" })).toMatch(/queue/);
    expect(announcer.say({ kind: "settled" })).toMatch(/normal/);
  });
});
