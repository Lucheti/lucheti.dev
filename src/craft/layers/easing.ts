/** Clamps `value` into 0…1. */
export function clamp01(value: number): number {
  return value <= 0 ? 0 : value >= 1 ? 1 : value;
}

/** Slow in, slow out: a cubic that leaves and arrives with zero speed, so a hold before or after never jolts. */
export function easeInOutCubic(progress: number): number {
  const t = clamp01(progress);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Fast out, soft landing: for a ripple that leaves quickly and settles. */
export function easeOutCubic(progress: number): number {
  const t = clamp01(progress);
  return 1 - Math.pow(1 - t, 3);
}

/** 0 below `from`, 1 above `to`, and a smooth Hermite step between. */
export function smoothstep(from: number, to: number, value: number): number {
  const t = clamp01((value - from) / (to - from));
  return t * t * (3 - 2 * t);
}
