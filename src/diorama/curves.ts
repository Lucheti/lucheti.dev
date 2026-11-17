/**
 * The shapes of the diorama's reactions, as pure functions of `age`: the seconds since the reaction was
 * kicked off. Every curve rests at its neutral value before it starts (a negative or infinite age) and
 * settles back to it a couple of seconds after.
 */

/** A reaction older than this has settled for good. */
export const SETTLED_AFTER = 2.5;

function started(age: number): boolean {
  return Number.isFinite(age) && age >= 0;
}

/** A damped wobble: 0 at the start, swinging `frequency` times a second and dying away at `decay` per second. */
export function ring(age: number, frequency: number, decay: number): number {
  if (!started(age)) {
    return 0;
  }
  return Math.exp(-decay * age) * Math.sin(2 * Math.PI * frequency * age);
}

/** A quick rise and a slower fall, from 0 back to 0: how far a pressed thing is in. Peaks a little under 1. */
export function pulse(age: number, attack: number, release: number): number {
  if (!started(age)) {
    return 0;
  }
  return (1 - Math.exp(-age / attack)) * Math.exp(-age / release);
}

/** One hop: up and down again over `duration` seconds, 0 to 1 to 0. */
export function hop(age: number, duration: number): number {
  if (!started(age) || age > duration) {
    return 0;
  }
  return Math.sin((Math.PI * age) / duration);
}

/** Squash and stretch, as scales: squashed first (short and wide), then stretched, then still. Volume roughly kept. */
export function squash(age: number, strength: number): Readonly<{ tall: number; wide: number }> {
  const wobble = ring(age, 2.4, 5.5);
  return { tall: 1 - strength * wobble, wide: 1 + strength * 0.55 * wobble };
}

/** A pop: grows past full size and settles at it. 0 at the start, 1 once settled. */
export function popIn(age: number): number {
  if (!started(age)) {
    return 1;
  }
  const t = Math.min(1, age / 0.35);
  const back = 1.9;
  const eased = 1 + (back + 1) * Math.pow(t - 1, 3) + back * Math.pow(t - 1, 2);
  return eased;
}
