/** A spike's shape: how much traffic multiplies at its peak, and how long it rises, holds and falls, in ms. */
export type SpikeShape = Readonly<{ peak: number; riseMs: number; holdMs: number; fallMs: number }>;

/** Eases 0 → 1 with a soft start and end. */
function smooth(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/**
 * A traffic spike as a function of time: the multiplier on the steady traffic rises from 1 to the peak, holds
 * there, then falls back to 1. Only one runs at a time.
 */
export class Spike {
  private startedAt: number | null = null;

  public constructor(private readonly shape: SpikeShape) {
    const { peak, riseMs, holdMs, fallMs } = shape;
    if (!(peak >= 1) || !Number.isFinite(peak)) {
      throw new Error(`A spike multiplies traffic by 1 or more: ${peak}`);
    }
    if (![riseMs, holdMs, fallMs].every((ms) => ms > 0 && Number.isFinite(ms))) {
      throw new Error(`Every part of a spike takes some time: ${JSON.stringify(shape)}`);
    }
  }

  /** Starts a spike at `now`, unless one is running. Says whether it started. */
  public start(now: number): boolean {
    if (this.running(now)) {
      return false;
    }
    this.startedAt = now;
    return true;
  }

  /** Whether a spike is running at `now`. */
  public running(now: number): boolean {
    return this.startedAt !== null && now - this.startedAt < this.length();
  }

  /** The traffic multiplier at `now`: 1 outside a spike. */
  public multiplier(now: number): number {
    if (!this.running(now) || this.startedAt === null) {
      return 1;
    }
    const { peak, riseMs, holdMs, fallMs } = this.shape;
    const t = now - this.startedAt;
    const level = t < riseMs ? smooth(t / riseMs) : t < riseMs + holdMs ? 1 : 1 - smooth((t - riseMs - holdMs) / fallMs);
    return 1 + (peak - 1) * level;
  }

  private length(): number {
    return this.shape.riseMs + this.shape.holdMs + this.shape.fallMs;
  }
}
