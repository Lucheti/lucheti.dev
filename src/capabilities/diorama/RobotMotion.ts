import { assertNever } from "../office/assertNever";
import type { RobotMood } from "../office";

/**
 * What a robot's hands are doing:
 * - `rest`: hanging, swaying a little;
 * - `type`: tapping at the keyboard, one hand then the other;
 * - `paint`: one arm drawing on the easel;
 * - `hold`: one arm holding a tool out (the stamp, the magnifier), `drop` lowering it;
 * - `cheer`: both arms up, waving.
 */
export type Hands =
  | Readonly<{ kind: "rest" }>
  | Readonly<{ kind: "type" }>
  | Readonly<{ kind: "paint" }>
  | Readonly<{ kind: "hold"; drop: number }>
  | Readonly<{ kind: "cheer" }>;

/** A robot's pose at one moment, in island units and radians. */
export type RobotPose = Readonly<{
  /** How far it rises off the floor: a breathing bob, or a hop when it cheers. */
  lift: number;
  headYaw: number;
  /** Positive tips the head down, toward the desk. */
  headPitch: number;
  /** How open its eyes are: 1 open, near 0 shut in a blink. */
  eyes: number;
  /** Each arm's swing forward about the shoulder, left then right; negative raises it to the front. */
  arms: readonly [number, number];
}>;

/** How long a blink keeps the eyes shut, in seconds. */
const BLINK = 0.13;

/** A robot's own rhythm from its seed, so seven robots never blink or look round in step. */
function rhythm(seed: number): Readonly<{ phase: number; every: number }> {
  return { phase: (seed * 1.618) % 1, every: 2.6 + ((seed * 0.731) % 1) * 2.2 };
}

/** How open the eyes are at `time`: shut for a beat once every few seconds. */
export function eyesAt(time: number, seed: number): number {
  const { phase, every } = rhythm(seed);
  const into = (((time / every + phase) % 1) + 1) % 1;
  return into * every < BLINK ? 0.1 : 1;
}

/** Each arm's swing for what the hands are doing. */
export function armsFor(hands: Hands, time: number, seed: number): readonly [number, number] {
  switch (hands.kind) {
    case "rest": {
      const sway = 0.08 * Math.sin(time * 1.3 + seed);
      return [sway, -sway];
    }
    case "type":
      return [-0.95 + 0.2 * Math.sin(time * 21 + seed), -0.95 + 0.2 * Math.sin(time * 21 + seed + Math.PI)];
    case "paint":
      return [0.05, -1.35 + 0.35 * Math.sin(time * 5.5 + seed)];
    case "hold":
      return [0.05, -1.25 + 0.45 * hands.drop];
    case "cheer":
      return [-2.6 + 0.25 * Math.sin(time * 9 + seed), -2.6 + 0.25 * Math.sin(time * 9 + seed + 1.3)];
    default:
      return assertNever(hands);
  }
}

/**
 * A robot's pose as a pure function of time, its seed, its mood and its hands. Idle, it breathes, blinks
 * and looks round; at work it tips its head down to the desk; cheering, it hops with its arms up; frowning,
 * it shakes its head.
 */
export function robotPose(time: number, seed: number, mood: RobotMood, hands: Hands): RobotPose {
  const bob = 0.012 * Math.sin(time * 2.1 + seed * 2.3);
  const look = 0.32 * Math.sin(time * 0.47 + seed * 1.7) + 0.14 * Math.sin(time * 1.13 + seed);
  const eyes = eyesAt(time, seed);
  const arms = armsFor(hands, time, seed);
  switch (mood) {
    case "idle":
      return { lift: bob, headYaw: look, headPitch: 0.04 * Math.sin(time * 0.8 + seed), eyes, arms };
    case "work":
      return { lift: bob * 0.5, headYaw: look * 0.25, headPitch: 0.2, eyes, arms };
    case "cheer":
      return { lift: 0.07 * Math.abs(Math.sin(time * 7 + seed)), headYaw: 0, headPitch: -0.12, eyes: 1, arms };
    case "frown":
      return { lift: 0, headYaw: 0.3 * Math.sin(time * 15), headPitch: 0.1, eyes, arms };
    default:
      return assertNever(mood);
  }
}
