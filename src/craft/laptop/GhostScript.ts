import { assertNever } from "../layers/assertNever";
import type { View } from "./views";

/** A point on the screen, in its own pixels from its top left. */
export type Point = Readonly<{ x: number; y: number }>;

/** Something on the screen the cursor can go to. Rows and their status icons are counted from the top of the list. */
export type GhostTarget =
  | Readonly<{ kind: "rest" }>
  | Readonly<{ kind: "row"; slot: number }>
  | Readonly<{ kind: "status"; slot: number }>
  | Readonly<{ kind: "search" }>
  | Readonly<{ kind: "view"; view: View }>;

/** What a click or a key press does to the app. */
export type GhostEffect =
  | Readonly<{ kind: "complete"; slot: number }>
  | Readonly<{ kind: "open-palette" }>
  | Readonly<{ kind: "type"; query: string }>
  | Readonly<{ kind: "close-palette" }>
  | Readonly<{ kind: "select"; view: View }>;

/** One beat of the loop. Durations in ms. */
export type GhostStep =
  | Readonly<{ kind: "move"; to: GhostTarget; ms: number }>
  | Readonly<{ kind: "wait"; ms: number }>
  | Readonly<{ kind: "click"; effect: GhostEffect; ms: number }>
  | Readonly<{ kind: "type"; text: string; msPerKey: number }>
  | Readonly<{ kind: "key"; effect: GhostEffect; ms: number }>;

/** Where the cursor is and what it is doing at one moment. */
export type GhostFrame = Readonly<{
  point: Point;
  /** The button is held down. */
  pressed: boolean;
  /** What the cursor rests over; null while it travels. */
  over: GhostTarget | null;
}>;

/** Where a target is on the screen right now. */
export type Locator = (target: GhostTarget) => Point;

/** How long a click holds the button down; the click lands as it lets go. */
export const PRESS_MS = 140;

type TimedStep = Readonly<{ step: GhostStep; start: number; end: number; from: GhostTarget }>;
type TimedEffect = Readonly<{ at: number; effect: GhostEffect }>;

/**
 * The ghost cursor's loop: a list of steps (move, wait, click, type, press a key) laid out in time. It is a
 * pure function of time: `frameAt(t)` says where the cursor is and what it is doing, and `effectsBetween`
 * says which clicks and key presses landed in a stretch of time, so the caller can apply them. The loop
 * repeats; the first move starts from where the last one ended.
 */
export class GhostScript {
  private readonly timed: readonly TimedStep[];
  private readonly effects: readonly TimedEffect[];
  private readonly total: number;

  public constructor(steps: readonly GhostStep[]) {
    const moves = steps.filter((step): step is Extract<GhostStep, { kind: "move" }> => step.kind === "move");
    if (moves.length === 0) {
      throw new Error("A ghost loop needs at least one move");
    }
    let from: GhostTarget = moves[moves.length - 1].to;
    let clock = 0;
    const timed: TimedStep[] = [];
    const effects: TimedEffect[] = [];
    for (const step of steps) {
      const length = GhostScript.lengthOf(step);
      if (!(length > 0) || !Number.isFinite(length)) {
        throw new Error(`Every step must take some time: ${JSON.stringify(step)}`);
      }
      timed.push({ step, start: clock, end: clock + length, from });
      effects.push(...GhostScript.effectsOf(step, clock));
      if (step.kind === "move") {
        from = step.to;
      }
      clock += length;
    }
    this.timed = timed;
    this.effects = effects;
    this.total = clock;
  }

  /** How long one loop takes, in ms. */
  public duration(): number {
    return this.total;
  }

  /** The cursor at `time` ms since the loop first started; it wraps round. */
  public frameAt(time: number, locate: Locator): GhostFrame {
    const local = this.wrap(time);
    const index = this.timed.findIndex((entry) => local < entry.end);
    const current = this.timed[index === -1 ? this.timed.length - 1 : index];
    const { step } = current;
    switch (step.kind) {
      case "move": {
        const progress = Math.min(1, Math.max(0, (local - current.start) / step.ms));
        const arrived = progress >= 1;
        return {
          point: GhostScript.glide(locate(current.from), locate(step.to), progress),
          pressed: false,
          over: arrived ? step.to : null,
        };
      }
      case "click":
        return { point: locate(current.from), pressed: local - current.start < PRESS_MS, over: current.from };
      case "wait":
      case "type":
      case "key":
        return { point: locate(current.from), pressed: false, over: current.from };
      default:
        return assertNever(step);
    }
  }

  /** The effects that landed after `from` and up to `to`, both in ms since the loop first started, in order. */
  public effectsBetween(from: number, to: number): readonly GhostEffect[] {
    if (!(to > from)) {
      return [];
    }
    const start = Math.max(from, to - this.total);
    const landed: GhostEffect[] = [];
    for (let loop = Math.floor(start / this.total); loop * this.total <= to; loop += 1) {
      for (const { at, effect } of this.effects) {
        const when = loop * this.total + at;
        if (when > start && when <= to) {
          landed.push(effect);
        }
      }
    }
    return landed;
  }

  private wrap(time: number): number {
    return ((time % this.total) + this.total) % this.total;
  }

  private static lengthOf(step: GhostStep): number {
    switch (step.kind) {
      case "move":
      case "wait":
      case "click":
      case "key":
        return step.ms;
      case "type":
        return step.text.length * step.msPerKey;
      default:
        return assertNever(step);
    }
  }

  private static effectsOf(step: GhostStep, start: number): readonly TimedEffect[] {
    switch (step.kind) {
      case "move":
      case "wait":
        return [];
      case "click":
        return [{ at: start + Math.min(PRESS_MS, step.ms), effect: step.effect }];
      case "key":
        return [{ at: start, effect: step.effect }];
      case "type":
        return [...step.text].map((_, index) => ({
          at: start + (index + 0.5) * step.msPerKey,
          effect: { kind: "type", query: step.text.slice(0, index + 1) },
        }));
      default:
        return assertNever(step);
    }
  }

  /**
   * Partway from `a` to `b`: eased in and out like a hand, along a shallow arc rather than a ruler-straight
   * line. `progress` runs from 0 to 1.
   */
  private static glide(a: Point, b: Point, progress: number): Point {
    const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distance = Math.hypot(dx, dy);
    if (distance === 0) {
      return a;
    }
    const bow = Math.sin(Math.PI * eased) * Math.min(28, distance * 0.1);
    return {
      x: a.x + dx * eased + (dy / distance) * bow,
      y: a.y + dy * eased - (dx / distance) * bow,
    };
  }
}
