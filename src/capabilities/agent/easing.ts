/** A scale on two axes, about the point an element stands on. */
export type Scale2 = Readonly<{ x: number; y: number }>;

/** Keeps a progress inside [0, 1]. */
export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** The point `progress` of the way from `from` to `to`. */
export function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

/** Slow out, slow in: a walk that starts and stops gently. */
export function easeInOutSine(progress: number): number {
  return -(Math.cos(Math.PI * clamp01(progress)) - 1) / 2;
}

/** Fast out, gentle landing. */
export function easeOutCubic(progress: number): number {
  return 1 - (1 - clamp01(progress)) ** 3;
}

/** Overshoots a little and settles: the way a badge pops in. */
export function easeOutBack(progress: number): number {
  const p = clamp01(progress) - 1;
  const overshoot = 1.70158;
  return 1 + (overshoot + 1) * p ** 3 + overshoot * p ** 2;
}

/**
 * Squash and stretch after an impact, `progress` 0 to 1: squashed flat at the start, a stretch, then a
 * damped wobble that settles at rest. The area is kept (x · y = 1), so it reads as soft, not shrinking.
 */
export function squashStretch(progress: number, strength = 0.22): Scale2 {
  const p = clamp01(progress);
  const y = 1 - strength * Math.exp(-3.4 * p) * Math.cos(3 * Math.PI * p);
  return { x: 1 / y, y };
}
