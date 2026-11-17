import { assertNever } from "../queue/assertNever";
import type { ServiceStatusKind } from "../queue/types";

/** The status lamp's colours. */
export type LampColour = "green" | "amber" | "red";

/** How a service machine looks and moves in one status. */
export type ServiceLook = Readonly<{
  lamp: LampColour;
  /** How many times a second the lamp blinks; 0 holds it steady. */
  blink: number;
  /** How far the machine bobs as it hums, in island units. */
  hum: number;
  /** How hard it rattles side to side, in island units. */
  shake: number;
  /** How far it slumps over, in radians. */
  slump: number;
  /** Whether it puffs smoke. */
  smoke: boolean;
  /** Whether the fuse under its screen burns toward the moment it gives way. */
  fuse: boolean;
  /** What its screen shows: the count of messages done, a spinner, or the word for down. */
  screen: "count" | "spinner" | "down";
}>;

/**
 * The look of each service status, as a pure mapping. Healthy machines hum along under a green light;
 * busy ones go amber, rattle and burn their fuse; a machine that is down slumps over under a red light and
 * smokes; a restarting one stands back up with its lamp blinking and a spinner on its screen.
 */
export function lookOf(kind: ServiceStatusKind): ServiceLook {
  switch (kind) {
    case "healthy":
      return { lamp: "green", blink: 0, hum: 0.018, shake: 0, slump: 0, smoke: false, fuse: false, screen: "count" };
    case "busy":
      return { lamp: "amber", blink: 0, hum: 0.01, shake: 0.028, slump: 0, smoke: false, fuse: true, screen: "count" };
    case "down":
      return { lamp: "red", blink: 0, hum: 0, shake: 0, slump: 0.2, smoke: true, fuse: false, screen: "down" };
    case "restarting":
      return { lamp: "green", blink: 3, hum: 0, shake: 0, slump: 0, smoke: false, fuse: false, screen: "spinner" };
    default:
      return assertNever(kind);
  }
}

/** Whether a lamp blinking `blink` times a second is lit `seconds` into its status. */
export function lampLit(blink: number, seconds: number): boolean {
  if (blink <= 0) {
    return true;
  }
  return (seconds * blink) % 1 < 0.5;
}
