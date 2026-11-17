import { assertNever } from "../layers/assertNever";
import { clamp01 } from "../layers/easing";
import { length, minus, samePoint, unit, type MutablePoint3, type Point3 } from "./space";

/** How progress is paced through the stretch that arrives at a keyframe. */
export type Pace =
  /** Even speed: for passing through a keyframe without a pause. */
  | "steady"
  /** Starts slowly and keeps speeding up into the keyframe. */
  | "gather"
  /** Leaves quickly and settles into the keyframe. */
  | "settle"
  /** Slow at both ends. */
  | "glide";

/** One framed shot on the path, at progress `at`. */
export type CameraKeyframe = Readonly<{
  at: number;
  position: Point3;
  target: Point3;
  /** Vertical field of view, in degrees. */
  fov: number;
  /** How the stretch arriving here is paced; the first keyframe's is unused. */
  pace: Pace;
}>;

/** The camera's pose at one moment. Writable, so a frame can reuse one. */
export type CameraPose = { position: MutablePoint3; target: MutablePoint3; fov: number };

/** A fresh pose to sample into. */
export function blankPose(): CameraPose {
  return { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, fov: 30 };
}

/** Maps a stretch's own progress through its pace. */
export function paced(pace: Pace, progress: number): number {
  const t = clamp01(progress);
  switch (pace) {
    case "steady":
      return t;
    case "gather":
      return t * t;
    case "settle":
      return 1 - (1 - t) * (1 - t);
    case "glide":
      return t * t * (3 - 2 * t);
    default:
      return assertNever(pace);
  }
}

/**
 * A camera move as a pure function of progress p, 0 to 1: framed keyframes with smooth curves between them.
 * Position and target follow cubic Hermite curves with Catmull-Rom directions, so the camera passes through a
 * keyframe without a corner; a keyframe that starts or ends a hold (two equal neighbours) or the path gets a
 * zero tangent, so holds never drift. Owns the rules that keyframes are in order, start at 0 and end at 1,
 * and that every pose lands exactly on its keyframe at that keyframe's progress.
 */
export class CameraPath {
  private readonly positionTangents: readonly Point3[];
  private readonly targetTangents: readonly Point3[];

  public constructor(private readonly keyframes: readonly CameraKeyframe[]) {
    if (keyframes.length < 2) {
      throw new Error(`A path needs at least two keyframes: ${keyframes.length}`);
    }
    if (keyframes[0].at !== 0 || keyframes[keyframes.length - 1].at !== 1) {
      throw new Error(`A path runs from progress 0 to 1`);
    }
    keyframes.forEach((frame, index) => {
      if (index > 0 && !(frame.at > keyframes[index - 1].at)) {
        throw new Error(`Keyframes must be in strictly increasing order: ${keyframes[index - 1].at} then ${frame.at}`);
      }
      if (!(frame.fov > 0 && frame.fov < 180)) {
        throw new Error(`A field of view is between 0° and 180°: ${frame.fov}`);
      }
      const coordinates = [frame.position, frame.target].flatMap((p) => [p.x, p.y, p.z]);
      if (!coordinates.every(Number.isFinite)) {
        throw new Error(`Keyframe at ${frame.at} has a coordinate that is not finite`);
      }
      if (samePoint(frame.position, frame.target)) {
        throw new Error(`Keyframe at ${frame.at} looks at its own position`);
      }
    });
    this.positionTangents = CameraPath.tangents(keyframes.map((frame) => frame.position));
    this.targetTangents = CameraPath.tangents(keyframes.map((frame) => frame.target));
  }

  /** How many keyframes the path has. */
  public size(): number {
    return this.keyframes.length;
  }

  /** The keyframe at `index`. */
  public keyframe(index: number): CameraKeyframe {
    return this.keyframes[index];
  }

  /** Writes the pose at progress `p` (clamped into 0…1) into `out`. */
  public sample(p: number, out: CameraPose): CameraPose {
    const progress = clamp01(Number.isFinite(p) ? p : 0);
    const segment = this.segmentAt(progress);
    const from = this.keyframes[segment];
    const to = this.keyframes[segment + 1];
    const t = paced(to.pace, (progress - from.at) / (to.at - from.at));
    const { positionTangents: positions, targetTangents: targets } = this;
    CameraPath.hermite(from.position, to.position, positions[segment], positions[segment + 1], t, out.position);
    CameraPath.hermite(from.target, to.target, targets[segment], targets[segment + 1], t, out.target);
    out.fov = from.fov + (to.fov - from.fov) * t;
    return out;
  }

  /** The index of the keyframe that starts the stretch holding `progress`. */
  private segmentAt(progress: number): number {
    for (let index = this.keyframes.length - 2; index > 0; index -= 1) {
      if (progress >= this.keyframes[index].at) {
        return index;
      }
    }
    return 0;
  }

  /**
   * The direction the curve passes through each keyframe in, as a unit vector: Catmull-Rom's, from the
   * keyframe before to the one after. Zero at the ends and wherever a keyframe meets an equal neighbour.
   */
  private static tangents(points: readonly Point3[]): readonly Point3[] {
    return points.map((current, index) => {
      const before = points[index - 1];
      const after = points[index + 1];
      if (before === undefined || after === undefined || samePoint(before, current) || samePoint(current, after)) {
        return { x: 0, y: 0, z: 0 };
      }
      return unit(minus(after, before));
    });
  }

  /**
   * The cubic Hermite curve from `a` to `b` leaving along `ta` and arriving along `tb`, at `t`. The tangents
   * are scaled by this stretch's own length, so a short stretch after a long one never overshoots.
   */
  private static hermite(a: Point3, b: Point3, ta: Point3, tb: Point3, t: number, out: MutablePoint3): void {
    const reach = length(minus(b, a));
    const t2 = t * t;
    const t3 = t2 * t;
    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = (t3 - 2 * t2 + t) * reach;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = (t3 - t2) * reach;
    out.x = h00 * a.x + h10 * ta.x + h01 * b.x + h11 * tb.x;
    out.y = h00 * a.y + h10 * ta.y + h01 * b.y + h11 * tb.y;
    out.z = h00 * a.z + h10 * ta.z + h01 * b.z + h11 * tb.z;
  }
}
