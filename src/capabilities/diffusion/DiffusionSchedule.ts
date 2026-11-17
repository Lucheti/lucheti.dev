/** How the toy denoises: how much noise is left at each step and how long a run lasts. */
export class DiffusionSchedule {
  /** `steps` is the number of visible denoising steps; `durationMs` the length of a whole run. */
  public constructor(
    private readonly steps: number,
    private readonly durationMs: number,
  ) {
    if (!Number.isInteger(steps) || steps < 1) {
      throw new Error(`A schedule needs at least one step, not ${steps}`);
    }
    if (!Number.isFinite(durationMs) || durationMs <= 0) {
      throw new Error(`A run must last longer than zero, not ${durationMs}`);
    }
  }

  /** The number of visible steps. */
  public stepCount(): number {
    return this.steps;
  }

  /** The length of a whole run, in ms. */
  public duration(): number {
    return this.durationMs;
  }

  /** How far a run is `elapsedMs` after it started, from 0 to 1. */
  public progressAt(elapsedMs: number): number {
    return clamp01(elapsedMs / this.durationMs);
  }

  /**
   * The noise amount left at a progress from 0 to 1: 1 is pure noise, 0 is the finished picture. A cosine
   * schedule, so the noise lingers for the first steps and the picture then comes up quickly.
   */
  public noiseAt(progress: number): number {
    const cosine = Math.cos(clamp01(progress) * (Math.PI / 2));
    return cosine * cosine;
  }

  /** The step to show as "Step n/N" at a progress: 0 before anything happened, N once finished. */
  public stepAt(progress: number): number {
    return Math.min(this.steps, Math.floor(clamp01(progress) * this.steps));
  }

  /** The noise amount that remains once `step` steps are done. */
  public noiseAfterStep(step: number): number {
    return this.noiseAt(Math.min(this.steps, Math.max(0, step)) / this.steps);
  }

  /** How soft the picture still is, in px of blur, for a noise amount; the picture sharpens as the noise leaves. */
  public softnessAt(noise: number, maxBlurPx: number): number {
    return clamp01(noise) * maxBlurPx;
  }
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
