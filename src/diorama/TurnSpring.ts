/** How the island turns under a drag and springs back. */
export type TurnRules = Readonly<{
  /** The furthest it turns either way, in radians; it approaches this softly and never passes it. */
  reach: number;
  /** Radians of turn per pixel dragged, before the soft limit. */
  perPixel: number;
  /** The spring's pull back to rest, per second squared. */
  stiffness: number;
  /** The spring's damping, per second; a little under critical gives one soft overshoot. */
  damping: number;
}>;

/** The spring is integrated in steps no longer than this, so a long frame never makes it unstable. */
const SUBSTEP = 1 / 240;
/** Closer to rest than this, in angle and speed, it stops. */
const REST = 1e-4;

/**
 * The island's turn about its vertical axis under a drag: it follows the pointer within a soft limit while
 * held, and on release springs softly back to rest. A pure stepper; time comes in through `step`.
 */
export class TurnSpring {
  private angle = 0;
  private velocity = 0;
  private holding = false;
  /** Where the drag started, before the soft limit, so a grab mid-spring picks the island up where it is. */
  private grabbedAt = 0;

  public constructor(private readonly rules: TurnRules) {
    if (!(rules.reach > 0) || !(rules.perPixel > 0) || !(rules.stiffness > 0) || !(rules.damping >= 0)) {
      throw new Error(`A turn needs a reach, a drag rate and a stiffness above zero, and a damping that is not negative`);
    }
  }

  /** The pointer took hold of the island. */
  public grab(): void {
    const share = Math.max(-0.999, Math.min(0.999, this.angle / this.rules.reach));
    this.grabbedAt = this.rules.reach * Math.atanh(share);
    this.velocity = 0;
    this.holding = true;
  }

  /** The pointer is `pixels` to the right of where it took hold (negative: to the left). */
  public drag(pixels: number): void {
    if (!this.holding) {
      return;
    }
    const wanted = this.grabbedAt + pixels * this.rules.perPixel;
    this.angle = this.rules.reach * Math.tanh(wanted / this.rules.reach);
  }

  /** The pointer let go: spring back. */
  public release(): void {
    this.holding = false;
  }

  /** Lets `seconds` pass. While held, nothing moves by itself. */
  public step(seconds: number): void {
    if (this.holding || this.resting()) {
      return;
    }
    let left = Math.max(0, seconds);
    while (left > 0) {
      const dt = Math.min(SUBSTEP, left);
      this.velocity += (-this.rules.stiffness * this.angle - this.rules.damping * this.velocity) * dt;
      this.angle += this.velocity * dt;
      left -= dt;
    }
    if (Math.abs(this.angle) < REST && Math.abs(this.velocity) < REST) {
      this.angle = 0;
      this.velocity = 0;
    }
  }

  /** Back to rest at once, for reduced motion. */
  public home(): void {
    this.angle = 0;
    this.velocity = 0;
  }

  /** The turn now, in radians. */
  public yaw(): number {
    return this.angle;
  }

  /** Whether it is held. */
  public held(): boolean {
    return this.holding;
  }

  /** Whether it has come to rest and nobody holds it. */
  public resting(): boolean {
    return !this.holding && this.angle === 0 && this.velocity === 0;
  }
}
