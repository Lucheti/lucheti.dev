import { Quaternion, Vector3 } from "three";
import type { ShardField } from "./ShardField";

/** Reusable output slot for one shard's transform. */
export type ShardPose = { readonly position: Vector3; readonly quaternion: Quaternion };

/** The reader-independent inputs of a frame. `liveliness` is 0 for reduced motion, 1 otherwise. */
export type FrameInput = Readonly<{
  assembly: number;
  time: number;
  /** Damped pointer position, −1…1, y up. */
  pointerX: number;
  pointerY: number;
  liveliness: number;
}>;

const WINDOW_LENGTH = 0.45;
const DRIFT_AMPLITUDE = 0.08;
const WOBBLE_AMPLITUDE = 0.08;
const POINTER_REACH = 1.6;
const POINTER_PART = 0.35;

/**
 * Where each shard is at a given assembly and moment.
 *
 * Owns the rule that every shard has its own window inside the assembly, is
 * exactly home when the assembly completes, and only drifts while scattered.
 */
export class AssemblyChoreography {
  private readonly lean = new Vector3();

  public constructor(private readonly field: ShardField) {}

  /** Allocates one pose per shard; call once, then reuse for every frame. */
  public allocate(): ShardPose[] {
    return Array.from({ length: this.field.count() }, () => ({
      position: new Vector3(),
      quaternion: new Quaternion(),
    }));
  }

  public place(index: number, input: FrameInput, out: ShardPose): void {
    const shard = this.field.shard(index);
    const arrived = AssemblyChoreography.arrival(input.assembly, shard.windowStart);
    const apart = 1 - arrived;
    const loose = (1 - Math.min(1, Math.max(0, input.assembly))) * input.liveliness;

    const clock = input.time * shard.driftRate + shard.driftPhase;
    const driftX = Math.sin(clock) * DRIFT_AMPLITUDE * loose;
    const driftY = Math.sin(clock * 0.83 + shard.driftPhase) * DRIFT_AMPLITUDE * loose;
    const driftZ = Math.sin(clock * 1.17 + 0.6) * DRIFT_AMPLITUDE * loose;

    out.position.copy(shard.home).addScaledVector(shard.scatterOffset, apart);
    out.position.x += driftX;
    out.position.y += driftY;
    out.position.z += driftZ;

    this.partFromPointer(shard.home, input, loose, out.position);

    const wobble = Math.sin(clock * 0.9) * WOBBLE_AMPLITUDE * loose;
    out.quaternion.setFromAxisAngle(shard.scatterAxis, shard.scatterAngle * apart + wobble);
  }

  /** Eased 0 → 1 progress of one shard through its own window. */
  public static arrival(assembly: number, windowStart: number): number {
    if (assembly >= 1) return 1;
    const t = Math.min(1, Math.max(0, (assembly - windowStart) / WINDOW_LENGTH));
    return t * t * (3 - 2 * t);
  }

  private partFromPointer(home: Vector3, input: FrameInput, loose: number, position: Vector3): void {
    if (loose === 0) return;
    const dx = home.x - input.pointerX * POINTER_REACH;
    const dy = home.y - input.pointerY * POINTER_REACH;
    const push = (POINTER_PART * loose) / (dx * dx + dy * dy + 0.5);
    this.lean.set(dx * push, dy * push, 0);
    position.add(this.lean);
  }
}
