import type { CameraPose } from "./CameraPath";
import type { MutablePoint3 } from "./space";

/**
 * Turns a camera pose a few degrees round its target, following the pointer: across about the world's up,
 * and up and down about the camera's own right. The distance to the target never changes. Pure; it writes
 * into the pose it is given.
 */
export class CameraSway {
  private readonly scratch: MutablePoint3 = { x: 0, y: 0, z: 0 };

  /** The reach either way, in radians: across and up. */
  public constructor(
    private readonly across: number,
    private readonly upward: number,
  ) {
    if (!(across >= 0) || !(upward >= 0)) {
      throw new Error(`A sway's reach cannot be negative`);
    }
  }

  /** Sways `pose` by the pointer's lean (`x`, `y`, each −1…1), scaled by `weight` (0 none, 1 full). */
  public apply(pose: CameraPose, x: number, y: number, weight: number): CameraPose {
    const yaw = -x * this.across * weight;
    const pitch = y * this.upward * weight;
    if (yaw === 0 && pitch === 0) {
      return pose;
    }
    const { position, target } = pose;
    const offset = this.scratch;
    offset.x = position.x - target.x;
    offset.y = position.y - target.y;
    offset.z = position.z - target.z;
    // Across: about the world's up.
    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);
    const turnedX = offset.x * cosYaw + offset.z * sinYaw;
    const turnedZ = -offset.x * sinYaw + offset.z * cosYaw;
    offset.x = turnedX;
    offset.z = turnedZ;
    // Up and down: about the horizontal axis square to the view, by Rodrigues' formula.
    const flat = Math.hypot(offset.x, offset.z);
    if (flat > 0) {
      const kx = -offset.z / flat;
      const kz = offset.x / flat;
      const cosPitch = Math.cos(pitch);
      const sinPitch = Math.sin(pitch);
      // The axis is square to the offset, so the k (k · v) term of the formula vanishes.
      const x2 = offset.x * cosPitch - kz * offset.y * sinPitch;
      const y2 = offset.y * cosPitch + (kz * offset.x - kx * offset.z) * sinPitch;
      const z2 = offset.z * cosPitch + kx * offset.y * sinPitch;
      offset.x = x2;
      offset.y = y2;
      offset.z = z2;
    }
    position.x = target.x + offset.x;
    position.y = target.y + offset.y;
    position.z = target.z + offset.z;
    return pose;
  }
}
