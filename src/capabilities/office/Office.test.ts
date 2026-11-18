import { describe, expect, it } from "vitest";
import { OFFICE_TIMING } from "./composeOffice";
import { IdeaQueue } from "./IdeaQueue";
import { Office, type OfficeRules } from "./Office";
import { QaVerdicts, type Chance } from "./QaVerdicts";
import { RoutePlanner } from "./RoutePlanner";
import type { OfficeEvent, TicketName } from "./types";

const NAMES: readonly TicketName[] = [
  { id: "F-12", title: "dark mode" },
  { id: "F-15", title: "search filters" },
];
const RULES: OfficeRules = { inFlight: 2, pause: 1.5, margin: 0.4 };
const STEP = 0.05;

/** Hands out a fixed list of draws, over and over. */
class Draws implements Chance {
  private index = 0;
  public constructor(private readonly values: readonly number[]) {}
  public next(): number {
    const value = this.values[this.index % this.values.length];
    this.index += 1;
    return value;
  }
}

function office(draws: readonly number[] = [0.9], limit = 12): Office {
  return new Office(new RoutePlanner(OFFICE_TIMING), new QaVerdicts(new Draws(draws), 0.25), new IdeaQueue(limit), NAMES, RULES);
}

function run(floor: Office, seconds: number, each?: () => void): OfficeEvent[] {
  const events: OfficeEvent[] = [];
  const stop = floor.listen((batch) => events.push(...batch));
  for (let time = 0; time < seconds; time += STEP) {
    floor.advance(STEP);
    each?.();
  }
  stop();
  return events;
}

describe("Office", () => {
  it("sends a ticket round by itself when nobody drops one, again and again", () => {
    const floor = office();
    floor.advance(STEP);
    expect(floor.tickets()).toHaveLength(1);
    expect(floor.view().current?.name).toEqual(NAMES[0]);
    const events = run(floor, 60);
    const shipped = events.filter((event) => event.kind === "shipped");
    expect(shipped.length).toBeGreaterThanOrEqual(2);
    expect(floor.view().shipped).toBe(shipped.length);
  });

  it("queues dropped ideas in the inbox and starts them as room opens, never more than two at once", () => {
    const floor = office();
    floor.advance(STEP);
    for (let drop = 0; drop < 4; drop += 1) {
      floor.drop();
    }
    expect(floor.view().waiting).toBe(4);
    let most = 0;
    run(floor, 90, () => {
      most = Math.max(most, floor.tickets().length);
    });
    expect(most).toBe(2);
    expect(floor.view().waiting).toBe(0);
    expect(floor.view().shipped).toBeGreaterThanOrEqual(5);
  });

  it("keeps two tickets apart: the second never reaches a station before the first has left it", () => {
    const floor = office([0.1, 0.9]);
    floor.advance(STEP);
    floor.drop();
    run(floor, 40, () => {
      const [first, second] = floor.tickets();
      if (first !== undefined && second !== undefined) {
        expect(second.beat.index).toBeLessThanOrEqual(first.beat.index);
        expect(second.serial).toBeGreaterThan(first.serial);
      }
    });
  });

  it("tells when QA sends a ticket back and when one ships", () => {
    const floor = office([0.1]);
    const events = run(floor, 40);
    expect(events[0]).toEqual({ kind: "bounced", name: NAMES[0] });
    expect(events).toContainEqual({ kind: "shipped", name: NAMES[0] });
  });

  it("turns an idea away when the inbox is full", () => {
    const floor = office([0.9], 2);
    const events: OfficeEvent[] = [];
    floor.listen((batch) => events.push(...batch));
    floor.drop();
    floor.drop();
    floor.drop();
    expect(events.map((event) => event.kind)).toEqual(["dropped", "dropped", "full"]);
    expect(floor.view().waiting).toBe(2);
  });

  it("plays the same way every time from the same draws", () => {
    const trace = (): string[] => {
      const floor = office([0.1, 0.9, 0.9, 0.2]);
      floor.drop();
      floor.drop();
      return run(floor, 80).map((event) => (event.kind === "bounced" || event.kind === "shipped" ? `${event.kind}:${event.name.id}` : event.kind));
    };
    expect(trace()).toEqual(trace());
  });

  it("changes its snapshot only when a word in the strip does", () => {
    const floor = office();
    let changes = 0;
    floor.subscribe(() => {
      changes += 1;
    });
    floor.advance(STEP);
    const first = floor.view();
    floor.advance(STEP);
    expect(floor.view()).toBe(first);
    run(floor, OFFICE_TIMING.stamp + OFFICE_TIMING.travel);
    expect(floor.view().current?.station).toBe("design");
    expect(floor.view().revision).toBe(changes);
  });
});
