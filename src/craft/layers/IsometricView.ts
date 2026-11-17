/** A point in model space: x across, y up, z towards the viewer's left. Mutable, so a frame can reuse one. */
export type Vec3 = { x: number; y: number; z: number };

/** A point on the screen plane in model units, y up. Mutable, so a frame can reuse one. */
export type Vec2 = { x: number; y: number };

/** The edges of a set of projected points, in model units, y up. */
export type ScreenBounds = Readonly<{ minX: number; maxX: number; minY: number; maxY: number }>;

/** The pitch of a true isometric view: the camera looks down the cube's diagonal, atan(1/√2) ≈ 35.264°. */
export const ISOMETRIC_PITCH = Math.atan(Math.SQRT1_2);
/** The yaw of a true isometric view. */
export const ISOMETRIC_YAW = Math.PI / 4;

/**
 * An orthographic camera at a fixed yaw and pitch, and the model's own turn in front of it: a yaw about the
 * vertical axis, then a tilt about the screen's horizontal axis. Projects model points to the screen plane
 * the same way three.js does for a camera placed along `toCamera()` and a model rotated by
 * `tilt(right) · yaw(up)`, so the DOM labels and the SVG fallback land exactly on the WebGL drawing.
 */
export class IsometricView {
  private readonly back: Readonly<Vec3>;
  private readonly across: Readonly<Vec3>;
  private readonly upward: Readonly<Vec3>;
  private readonly scratch: Vec3 = { x: 0, y: 0, z: 0 };

  public constructor(yaw: number = ISOMETRIC_YAW, pitch: number = ISOMETRIC_PITCH) {
    if (!(pitch > 0 && pitch < Math.PI / 2)) {
      throw new Error(`The camera must look down from above the horizon: pitch ${pitch}`);
    }
    const cosPitch = Math.cos(pitch);
    this.back = { x: Math.sin(yaw) * cosPitch, y: Math.sin(pitch), z: Math.cos(yaw) * cosPitch };
    this.across = { x: Math.cos(yaw), y: 0, z: -Math.sin(yaw) };
    const b = this.back;
    const a = this.across;
    this.upward = { x: b.y * a.z - b.z * a.y, y: b.z * a.x - b.x * a.z, z: b.x * a.y - b.y * a.x };
  }

  /** The unit direction from the model to the camera. */
  public toCamera(): Readonly<Vec3> {
    return this.back;
  }

  /** The screen's rightward direction in model space: the axis the model tilts about. */
  public right(): Readonly<Vec3> {
    return this.across;
  }

  /** The screen's upward direction in model space. */
  public up(): Readonly<Vec3> {
    return this.upward;
  }

  /** Writes where `point`, turned by `yaw` then tilted by `tilt`, lands on the screen plane. */
  public project(point: Readonly<Vec3>, yaw: number, tilt: number, out: Vec2): Vec2 {
    const turned = this.turn(point, yaw, tilt, this.scratch);
    out.x = IsometricView.dot(turned, this.across);
    out.y = IsometricView.dot(turned, this.upward);
    return out;
  }

  /** Writes `point` turned by `yaw` about the vertical axis, then by `tilt` about the screen's right axis. */
  public turn(point: Readonly<Vec3>, yaw: number, tilt: number, out: Vec3): Vec3 {
    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);
    // three.js's rotation about +y: x' = x cos + z sin, z' = −x sin + z cos.
    const x = point.x * cosYaw + point.z * sinYaw;
    const y = point.y;
    const z = -point.x * sinYaw + point.z * cosYaw;
    // Rodrigues' formula about the unit axis k: v cos + (k × v) sin + k (k · v)(1 − cos).
    const k = this.across;
    const cosTilt = Math.cos(tilt);
    const sinTilt = Math.sin(tilt);
    const along = (k.x * x + k.y * y + k.z * z) * (1 - cosTilt);
    out.x = x * cosTilt + (k.y * z - k.z * y) * sinTilt + k.x * along;
    out.y = y * cosTilt + (k.z * x - k.x * z) * sinTilt + k.y * along;
    out.z = z * cosTilt + (k.x * y - k.y * x) * sinTilt + k.z * along;
    return out;
  }

  /** The screen edges of `points` over every turn the model may take, up to `yawReach` and `tiltReach` either side. */
  public bounds(points: readonly Readonly<Vec3>[], yawReach: number, tiltReach: number): ScreenBounds {
    if (points.length === 0) {
      throw new Error("Bounds need at least one point");
    }
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    const out: Vec2 = { x: 0, y: 0 };
    for (const yawStep of [-1, -0.5, 0, 0.5, 1]) {
      for (const tiltStep of [-1, 0, 1]) {
        for (const point of points) {
          this.project(point, yawStep * yawReach, tiltStep * tiltReach, out);
          minX = Math.min(minX, out.x);
          maxX = Math.max(maxX, out.x);
          minY = Math.min(minY, out.y);
          maxY = Math.max(maxY, out.y);
        }
      }
    }
    return { minX, maxX, minY, maxY };
  }

  private static dot(a: Readonly<Vec3>, b: Readonly<Vec3>): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }
}
