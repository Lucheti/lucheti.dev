import type { ServiceMapCopy } from "@/content";
import { assertNever } from "../queue/assertNever";
import type { BreakerPhase } from "./CircuitBreaker";
import type { HealthPhase } from "./ServiceHealth";
import type { NodeMetric } from "./types";

/** A status dot's colour: all well, needs a look, or failing. */
export type Signal = "ok" | "warn" | "bad";

/** The dot for a service's health. */
export function healthSignal(health: HealthPhase): Signal {
  switch (health) {
    case "up":
      return "ok";
    case "recovering":
      return "warn";
    case "down":
      return "bad";
    default:
      return assertNever(health);
  }
}

/** The pill on a breaker's edge, or none while it is closed. */
export function breakerPill(phase: BreakerPhase, copy: ServiceMapCopy["breaker"]): Readonly<{ text: string; signal: Signal }> | null {
  switch (phase) {
    case "closed":
      return null;
    case "open":
      return { text: copy.open, signal: "bad" };
    case "half-open":
      return { text: copy.halfOpen, signal: "warn" };
    default:
      return assertNever(phase);
  }
}

/** The queue's dot: fine while its bar is under half, a warning above. */
export function queueSignal(fill: number): Signal {
  return fill >= 0.5 ? "warn" : "ok";
}

/** A card's figure in words, from the copy's templates. */
export function metricText(metric: NodeMetric, copy: ServiceMapCopy["metrics"]): string {
  const fill = (template: string): string => template.replaceAll("{n}", metric.n.toLocaleString("en-US"));
  switch (metric.kind) {
    case "rate":
      return fill(copy.rate);
    case "ops":
      return fill(copy.ops);
    case "p95":
      return fill(copy.p95);
    case "queued":
      return fill(copy.queued);
    case "failed-fast":
      return fill(copy.failedFast);
    default:
      return assertNever(metric);
  }
}
