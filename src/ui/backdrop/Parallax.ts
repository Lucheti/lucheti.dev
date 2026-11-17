/**
 * The motif layer's vertical offset, in px, for the chapter's scroll progress:
 * −travel as the chapter enters from below, 0 halfway, +travel as it leaves at
 * the top. The layer lags the page, so it reads as further away. Progress
 * outside 0–1 is clamped.
 */
export function parallaxOffset(progress: number, travel: number): number {
  const clamped = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  return (clamped * 2 - 1) * travel;
}
