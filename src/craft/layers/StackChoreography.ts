import { clamp01, easeInOutCubic, easeOutCubic, smoothstep } from "./easing";

/** The breath's beats and the slower motions laid over it, in ms. */
export type StackTiming = Readonly<{
  /** Held closed, almost one card. */
  stackedMs: number;
  /** Opening into the exploded view. */
  openMs: number;
  /** Held wide open. */
  explodedMs: number;
  /** Closing back up. */
  closeMs: number;
  /** How much later each gap moves than the one above it. */
  staggerMs: number;
  /** One full sway, left and back and right and back. */
  swayMs: number;
  /** One ripple, from the press to gone. */
  rippleMs: number;
}>;

/** How the slabs sit: how many, the distance between neighbours closed and open, and the sway's reach. */
export type StackSpacing = Readonly<{
  layers: number;
  stackedGap: number;
  explodedGap: number;
  /** The sway's reach either side, in radians. */
  swayRadians: number;
  /** How many ripple rings are spreading at once, evenly out of step. */
  ripples: number;
}>;

/** A label starts to show once its layer is this far open, and is fully shown when it is all the way open. */
const LABEL_FROM = 0.55;
/** A ripple ring starts at this share of its full radius. */
const RIPPLE_START = 0.3;
/** How opaque a ripple ring is when it starts. */
const RIPPLE_OPACITY = 0.85;

/**
 * The stack's choreography, a pure function of time: it breathes from a tight stack to a wide exploded one
 * and back, each gap a little after the one above it, while the whole model sways slowly either side.
 *
 * Owns the rules that every gap stays between its closed and open sizes, so the slabs never pass through
 * one another; that the stack stays centred on the origin as it breathes; and that there is one moment,
 * `stillMs()`, when every gap is fully open and the sway is at rest, used for the still frame.
 */
export class StackChoreography {
  private readonly breathMs: number;
  private readonly still: number;

  public constructor(
    private readonly timing: StackTiming,
    private readonly spacing: StackSpacing,
  ) {
    const beats = [timing.stackedMs, timing.openMs, timing.explodedMs, timing.closeMs, timing.swayMs, timing.rippleMs];
    if (beats.some((beat) => !Number.isFinite(beat) || beat <= 0)) {
      throw new Error(`Every beat must last a finite time above zero: ${beats.join(", ")}`);
    }
    if (!Number.isInteger(spacing.layers) || spacing.layers < 2) {
      throw new Error(`A stack needs at least two layers: ${spacing.layers}`);
    }
    if (!(spacing.stackedGap > 0) || !(spacing.explodedGap > spacing.stackedGap)) {
      throw new Error(`The open gap must be wider than the closed one, and both above zero`);
    }
    if (!(timing.staggerMs >= 0) || timing.explodedMs <= this.spread()) {
      throw new Error(`The open hold must outlast the stagger, so every gap is fully open at once`);
    }
    if (!Number.isInteger(spacing.ripples) || spacing.ripples < 1) {
      throw new Error(`At least one ripple ring: ${spacing.ripples}`);
    }
    this.breathMs = timing.stackedMs + timing.openMs + timing.explodedMs + timing.closeMs;
    this.still = timing.stackedMs + timing.openMs + (this.spread() + timing.explodedMs) / 2;
  }

  /** One breath, closed to open to closed, in ms. */
  public breath(): number {
    return this.breathMs;
  }

  /** The moment every gap is wide open and the sway is centred: the still frame, and where the loop starts. */
  public stillMs(): number {
    return this.still;
  }

  /** How open gap `gap` is (1 sits between the bottom two layers), eased, 0 closed to 1 open. */
  public opening(gap: number, timeMs: number): number {
    const delay = (this.spacing.layers - 1 - gap) * this.timing.staggerMs;
    return easeInOutCubic(this.breathAt(timeMs - delay));
  }

  /** The height of layer `layer`'s base above the origin (or below it), with the stack centred on the origin. */
  public lift(layer: number, timeMs: number): number {
    let height = 0;
    let total = 0;
    for (let gap = 1; gap < this.spacing.layers; gap += 1) {
      total += this.gapAt(gap, timeMs);
      if (gap === layer) {
        height = total;
      }
    }
    return height - total / 2;
  }

  /** How far open a layer is: the gap under it, or for the bottom layer the gap over it. */
  public openness(layer: number, timeMs: number): number {
    return this.opening(Math.max(1, layer), timeMs);
  }

  /** How much a layer's label shows, 0 to 1: only as its layer nears fully open. */
  public labelOpacity(layer: number, timeMs: number): number {
    return smoothstep(LABEL_FROM, 1, this.openness(layer, timeMs));
  }

  /** The model's turn about the vertical axis, in radians, never past the sway's reach. */
  public sway(timeMs: number): number {
    return this.spacing.swayRadians * Math.sin(((timeMs - this.still) / this.timing.swayMs) * Math.PI * 2);
  }

  /** The sway's reach either side, in radians. */
  public swayReach(): number {
    return this.spacing.swayRadians;
  }

  /** How high the centred stack reaches above the origin when fully open, the same distance as it reaches below. */
  public reach(): number {
    return ((this.spacing.layers - 1) * this.spacing.explodedGap) / 2;
  }

  /** How many ripple rings spread at once. */
  public ripples(): number {
    return this.spacing.ripples;
  }

  /** A ripple ring's size as a share of its full radius. */
  public rippleScale(ring: number, timeMs: number): number {
    return RIPPLE_START + (1 - RIPPLE_START) * easeOutCubic(this.ripplePhase(ring, timeMs));
  }

  /** A ripple ring's opacity: strong as it leaves, gone as it reaches its full size. */
  public rippleOpacity(ring: number, timeMs: number): number {
    const remaining = 1 - this.ripplePhase(ring, timeMs);
    return RIPPLE_OPACITY * remaining * remaining;
  }

  private gapAt(gap: number, timeMs: number): number {
    const { stackedGap, explodedGap } = this.spacing;
    return stackedGap + (explodedGap - stackedGap) * this.opening(gap, timeMs);
  }

  /** The un-eased breath: 0 held closed, rising, 1 held open, falling. */
  private breathAt(timeMs: number): number {
    const { stackedMs, openMs, explodedMs, closeMs } = this.timing;
    const time = StackChoreography.wrap(timeMs, this.breathMs);
    if (time < stackedMs) {
      return 0;
    }
    if (time < stackedMs + openMs) {
      return (time - stackedMs) / openMs;
    }
    if (time < stackedMs + openMs + explodedMs) {
      return 1;
    }
    return clamp01(1 - (time - stackedMs - openMs - explodedMs) / closeMs);
  }

  private ripplePhase(ring: number, timeMs: number): number {
    return StackChoreography.wrap(timeMs / this.timing.rippleMs + ring / this.spacing.ripples, 1);
  }

  /** The delay between the top gap and the bottom one. */
  private spread(): number {
    return (this.spacing.layers - 2) * this.timing.staggerMs;
  }

  private static wrap(value: number, period: number): number {
    const wrapped = value % period;
    return wrapped < 0 ? wrapped + period : wrapped;
  }
}
