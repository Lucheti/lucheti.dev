import { describe, expect, it } from "vitest";
import { SITE } from "@/content";
import { breakerPill, healthSignal, metricText, queueSignal } from "./cardLook";

const copy = SITE.systems.map;

describe("card look", () => {
  it("colours a service's dot by its health", () => {
    expect(healthSignal("up")).toBe("ok");
    expect(healthSignal("recovering")).toBe("warn");
    expect(healthSignal("down")).toBe("bad");
  });

  it("puts a pill on a breaker's edge only while it is not closed", () => {
    expect(breakerPill("closed", copy.breaker)).toBeNull();
    expect(breakerPill("open", copy.breaker)).toEqual({ text: "Open", signal: "bad" });
    expect(breakerPill("half-open", copy.breaker)).toEqual({ text: "Half-open", signal: "warn" });
  });

  it("warns once the queue is half full", () => {
    expect(queueSignal(0.49)).toBe("ok");
    expect(queueSignal(0.5)).toBe("warn");
  });

  it("writes each figure from its template, with thousands separated", () => {
    expect(metricText({ kind: "rate", n: 182 }, copy.metrics)).toBe("182 req/s");
    expect(metricText({ kind: "p95", n: 42 }, copy.metrics)).toBe("p95 42 ms");
    expect(metricText({ kind: "queued", n: 1250 }, copy.metrics)).toBe("1,250 queued");
    expect(metricText({ kind: "failed-fast", n: 31 }, copy.metrics)).toBe("31 failed fast");
    expect(metricText({ kind: "ops", n: 270 }, copy.metrics)).toBe("270 ops/s");
  });
});
