import { assertNever } from "./assertNever";
import type { Beat, StationId } from "./types";

/**
 * What a station is doing at one moment, from the ticket that is at it:
 * - `idle`: no ticket is here; the robots idle;
 * - `stamp`: Product stamps a ticket;
 * - `sketch`: Design draws one on the easel;
 * - `type`: the three engineers build their parts;
 * - `inspect`: QA sweeps the magnifier over one;
 * - `verdict`: QA's light shows whether it passed;
 * - `launch`: Release's rocket lifts off with one and comes back.
 */
export type StationAction =
  | Readonly<{ kind: "idle" }>
  | Readonly<{ kind: "stamp"; progress: number }>
  | Readonly<{ kind: "sketch"; progress: number }>
  | Readonly<{ kind: "type"; progress: number }>
  | Readonly<{ kind: "inspect"; progress: number }>
  | Readonly<{ kind: "verdict"; pass: boolean; progress: number }>
  | Readonly<{ kind: "launch"; progress: number }>;

/** How a station's robots carry themselves: idling, heads down at work, cheering, or shaking their heads. */
export type RobotMood = "idle" | "work" | "cheer" | "frown";

/** QA's traffic light: dark, amber while it looks, then green or red. */
export type QaLight = "off" | "amber" | "green" | "red";

/** The rocket at one moment: how high over its pad, its flame from 0 to 1, its rumble, and its squash on landing. */
export type RocketPose = Readonly<{ height: number; flame: number; rumble: number; squash: number }>;

/** How a station's props and robots look for what it is doing. */
export type StationLook = Readonly<{
  mood: RobotMood;
  /** The stamp's drop: 0 at rest above the desk, 1 thumped down on the ticket, below 0 wound up. */
  stamp: number;
  /** How much of the sketch the easel should show, 0 to 1; null leaves the last one to fade. */
  sketch: number | null;
  /** Whether the engineers' screens flicker as they type. */
  typing: boolean;
  /** The magnifier's sweep across the ticket, from -1 to 1. */
  sweep: number;
  light: QaLight;
  rocket: RocketPose;
}>;

const ROCKET_REST: RocketPose = { height: 0, flame: 0, rumble: 0, squash: 0 };

const IDLE: StationLook = { mood: "idle", stamp: 0, sketch: null, typing: false, sweep: 0, light: "off", rocket: ROCKET_REST };

/** How high the rocket climbs, in island units. */
export const ROCKET_CLIMB = 1.35;

const STATIONS: readonly StationId[] = ["product", "design", "engineering", "qa", "release"];

/** `value` eased in and out over 0 to 1. */
function smooth(value: number): number {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

/** Where `value` sits between `from` and `to`, clamped to 0 to 1. */
function within(value: number, from: number, to: number): number {
  return Math.min(1, Math.max(0, (value - from) / (to - from)));
}

/** The station a step plays at and what it does there; null for a ticket flying between stations. */
export function actionOf(beat: Beat): Readonly<{ station: StationId; action: StationAction }> | null {
  const { leg, progress } = beat;
  switch (leg.kind) {
    case "stamp":
      return { station: "product", action: { kind: "stamp", progress } };
    case "sketch":
      return { station: "design", action: { kind: "sketch", progress } };
    case "type":
      return { station: "engineering", action: { kind: "type", progress } };
    case "inspect":
      return { station: "qa", action: { kind: "inspect", progress } };
    case "verdict":
      return { station: "qa", action: { kind: "verdict", pass: leg.pass, progress } };
    case "launch":
      return { station: "release", action: { kind: "launch", progress } };
    case "split":
    case "join":
    case "travel":
    case "bounce":
      return null;
    default:
      return assertNever(leg);
  }
}

/** What every station is doing, from the beats of the tickets on the floor; a station no ticket is at idles. */
export function actionsOf(beats: readonly Beat[]): Readonly<Record<StationId, StationAction>> {
  const actions = Object.fromEntries(STATIONS.map((station) => [station, { kind: "idle" } as StationAction])) as Record<StationId, StationAction>;
  for (const beat of beats) {
    const played = actionOf(beat);
    if (played !== null) {
      actions[played.station] = played.action;
    }
  }
  return actions;
}

/** The stamp over one stamping: a small wind-up, a thump down onto the ticket, a hold, and back up. */
export function stampDrop(progress: number): number {
  if (progress < 0.3) {
    return -0.25 * smooth(progress / 0.3);
  }
  if (progress < 0.42) {
    const t = within(progress, 0.3, 0.42);
    return -0.25 + 1.25 * t * t;
  }
  if (progress < 0.62) {
    return 1;
  }
  return 1 - smooth(within(progress, 0.62, 0.9));
}

/**
 * The rocket over one launch: the ticket boards and the engine rumbles, it lifts off and climbs, hangs a
 * moment at the top, drifts back down on a small flame, and lands on its pad with a squash.
 */
export function rocketAt(progress: number): RocketPose {
  const p = Math.min(1, Math.max(0, progress));
  const rumble = p > 0.1 && p < 0.3 ? Math.sin(within(p, 0.1, 0.3) * Math.PI) : 0;
  const climb = smooth(within(p, 0.26, 0.58));
  const fall = smooth(within(p, 0.68, 0.94));
  const height = ROCKET_CLIMB * climb * (1 - fall);
  const flame = p < 0.12 ? 0 : p < 0.62 ? Math.min(1, within(p, 0.12, 0.26) * 1.6) : p < 0.94 ? 0.35 : 0;
  const squash = p > 0.94 && p < 1 ? Math.sin(within(p, 0.94, 1) * Math.PI) : 0;
  return { height, flame, rumble, squash };
}

/** How a station looks for what it is doing. */
export function lookOf(action: StationAction): StationLook {
  switch (action.kind) {
    case "idle":
      return IDLE;
    case "stamp":
      return { ...IDLE, mood: "work", stamp: stampDrop(action.progress) };
    case "sketch":
      return { ...IDLE, mood: "work", sketch: smooth(within(action.progress, 0.08, 0.85)) };
    case "type":
      return { ...IDLE, mood: "work", typing: true };
    case "inspect":
      return { ...IDLE, mood: "work", sweep: Math.sin(action.progress * Math.PI * 3), light: "amber" };
    case "verdict":
      return { ...IDLE, mood: action.pass ? "cheer" : "frown", light: action.pass ? "green" : "red" };
    case "launch":
      return { ...IDLE, mood: "cheer", rocket: rocketAt(action.progress) };
    default:
      return assertNever(action);
  }
}
