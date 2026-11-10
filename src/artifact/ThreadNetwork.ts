import { BufferGeometry, Float32BufferAttribute } from "three";
import type { ShardPose } from "./AssemblyChoreography";
import { SeededRandom } from "./SeededRandom";
import type { NeighbourPair } from "./ShardField";

type Traveller = Readonly<{ thread: number; speed: number; phase: number }>;

const NODE_COUNT = 18;
const SEED = 77031;

/**
 * The lime threads between neighbouring shards and the bright nodes that
 * travel along them.
 *
 * Owns two geometries whose positions are rewritten every frame, so nothing
 * is allocated while animating.
 */
export class ThreadNetwork {
  private readonly lineGeometry = new BufferGeometry();
  private readonly nodeGeometry = new BufferGeometry();
  private readonly linePositions: Float32BufferAttribute;
  private readonly nodePositions: Float32BufferAttribute;
  private readonly travellers: readonly Traveller[];

  public constructor(private readonly pairs: readonly NeighbourPair[]) {
    if (pairs.length === 0) throw new RangeError("A thread network needs at least one pair");

    this.linePositions = new Float32BufferAttribute(new Float32Array(pairs.length * 6), 3);
    this.nodePositions = new Float32BufferAttribute(new Float32Array(NODE_COUNT * 3), 3);
    this.lineGeometry.setAttribute("position", this.linePositions);
    this.nodeGeometry.setAttribute("position", this.nodePositions);

    const rng = new SeededRandom(SEED);
    this.travellers = Array.from({ length: NODE_COUNT }, (_, i) => ({
      thread: (i * 5 + Math.floor(rng.between(0, 3))) % pairs.length,
      speed: rng.between(0.08, 0.26) * (rng.next() < 0.5 ? -1 : 1),
      phase: rng.next(),
    }));
  }

  public lines(): BufferGeometry {
    return this.lineGeometry;
  }

  public nodes(): BufferGeometry {
    return this.nodeGeometry;
  }

  /** Stretches each thread between the centres of its two shards. */
  public stretch(poses: readonly ShardPose[]): void {
    const array = this.linePositions.array as Float32Array;
    this.pairs.forEach(([a, b], i) => {
      const from = poses[a].position;
      const to = poses[b].position;
      const o = i * 6;
      array[o] = from.x;
      array[o + 1] = from.y;
      array[o + 2] = from.z;
      array[o + 3] = to.x;
      array[o + 4] = to.y;
      array[o + 5] = to.z;
    });
    this.linePositions.needsUpdate = true;
  }

  /** Moves every node along its thread; call after `stretch` so the ends are current. */
  public advance(time: number): void {
    const lines = this.linePositions.array as Float32Array;
    const nodes = this.nodePositions.array as Float32Array;
    this.travellers.forEach((node, i) => {
      const t = (((node.phase + time * node.speed) % 1) + 1) % 1;
      const o = node.thread * 6;
      const n = i * 3;
      nodes[n] = lines[o] + (lines[o + 3] - lines[o]) * t;
      nodes[n + 1] = lines[o + 1] + (lines[o + 4] - lines[o + 1]) * t;
      nodes[n + 2] = lines[o + 2] + (lines[o + 5] - lines[o + 2]) * t;
    });
    this.nodePositions.needsUpdate = true;
  }

  public dispose(): void {
    this.lineGeometry.dispose();
    this.nodeGeometry.dispose();
  }
}
