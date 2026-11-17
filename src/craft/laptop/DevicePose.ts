import type { HoverTilt } from "../layers/HoverTilt";

/** Degrees about each axis, CSS's way round: positive `rotateY` turns the face right, positive `rotateX` up. */
export type Angles = Readonly<{ x: number; y: number }>;

/** The laptop's pose at one moment. */
export type Pose = Readonly<{
  rotateX: number;
  rotateY: number;
  /** Where the glare sits across the glass, −1 (left) to 1 (right); it slides against the turn. */
  glare: number;
}>;

/** Below this lean, in −1 … 1 units, the laptop counts as back at rest. */
const STILL = 0.002;

/**
 * The laptop's angle: a fixed product-shot pose (seen from a little left and above) plus a few degrees of
 * damped lean toward the pointer while it hovers the panel. The lean itself is a `HoverTilt`.
 */
export class DevicePose {
  private aiming = false;

  /** `reach` is the most the pointer adds to the rest pose, in degrees, on each axis. */
  public constructor(
    private readonly tilt: HoverTilt,
    private readonly rest: Angles,
    private readonly reach: number,
  ) {
    if (!(reach >= 0) || !Number.isFinite(reach)) {
      throw new Error(`The lean's reach must be zero or more degrees: ${reach}`);
    }
  }

  /** Leans toward a pointer at (`x`, `y`) inside a box of `width` × `height`, from its top left. */
  public aim(x: number, y: number, width: number, height: number): void {
    this.tilt.aim(x, y, width, height);
    this.aiming = true;
  }

  /** The pointer left: ease back to the rest pose. */
  public release(): void {
    this.tilt.release();
    this.aiming = false;
  }

  /** Moves the lean `seconds` closer to where it is headed. */
  public settle(seconds: number): void {
    this.tilt.settle(seconds);
  }

  /** Whether it has come back to rest and nothing is pulling it, so the frames can stop. */
  public resting(): boolean {
    return !this.aiming && Math.abs(this.tilt.x()) < STILL && Math.abs(this.tilt.y()) < STILL;
  }

  /** The pose now. */
  public pose(): Pose {
    return {
      rotateX: this.rest.x + this.tilt.y() * this.reach,
      rotateY: this.rest.y + this.tilt.x() * this.reach,
      glare: -this.tilt.x(),
    };
  }
}
