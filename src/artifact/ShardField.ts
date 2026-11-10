import { BufferGeometry, Float32BufferAttribute, IcosahedronGeometry, Vector3 } from "three";
import { SeededRandom } from "./SeededRandom";

/** Everything the choreography needs to know about one shard. Never mutated after construction. */
export type ShardSpec = Readonly<{
  index: number;
  /** Centre of the face when assembled; the shard's geometry is modelled around this point. */
  home: Vector3;
  scatterOffset: Vector3;
  scatterAxis: Vector3;
  scatterAngle: number;
  /** Where in the 0 → 1 assembly this shard starts arriving. */
  windowStart: number;
  driftPhase: number;
  driftRate: number;
}>;

export type NeighbourPair = readonly [number, number];

const FACE_SHRINK = 0.94;
const INNER_RADIUS = 0.58;
// Kept tight on purpose: the scattered cloud should read as one object that
// has not come together yet, about twice the assembled size, not as debris.
const SCATTER_DISTANCE = { min: 0.45, max: 1.2 } as const;
const SCATTER_SIDEWAYS = { min: 0.08, max: 0.4 } as const;
const SCATTER_ANGLE = { min: 0.5, max: 1.2 } as const;
/** Latest start so that start + window length never exceeds 1. */
const LATEST_WINDOW_START = 0.55;
const SEED = 20260418;

/**
 * The 20 shards of the icosahedral shell: their geometry, their home and
 * scattered placements, and which of them touch along an edge.
 *
 * Owns the rule that a shard is a closed prism, the face triangle shrunk
 * toward its centroid and extruded inward to a fixed fraction of the radius.
 */
export class ShardField {
  private readonly specs: readonly ShardSpec[];
  private readonly geometries: readonly BufferGeometry[];
  private readonly pairs: readonly NeighbourPair[];

  public constructor() {
    const faces = ShardField.readFaces();
    const rng = new SeededRandom(SEED);
    const order = rng.permutation(faces.length);

    this.specs = faces.map((face, index) => ShardField.specFor(face, index, order[index], faces.length, rng));
    this.geometries = faces.map((face, index) => ShardField.buildGeometry(face, this.specs[index].home));
    this.pairs = ShardField.findNeighbours(faces);
  }

  public count(): number {
    return this.specs.length;
  }

  public shard(index: number): ShardSpec {
    return this.specs[index];
  }

  public geometry(index: number): BufferGeometry {
    return this.geometries[index];
  }

  public neighbourPairs(): readonly NeighbourPair[] {
    return this.pairs;
  }

  public dispose(): void {
    for (const geometry of this.geometries) geometry.dispose();
  }

  private static readFaces(): Vector3[][] {
    const source = new IcosahedronGeometry(1, 0);
    const position = source.getAttribute("position");
    const faces: Vector3[][] = [];
    for (let i = 0; i < position.count; i += 3) {
      faces.push([0, 1, 2].map((k) => new Vector3().fromBufferAttribute(position, i + k)));
    }
    source.dispose();
    return faces;
  }

  private static centroid(face: readonly Vector3[]): Vector3 {
    return new Vector3().add(face[0]).add(face[1]).add(face[2]).multiplyScalar(1 / 3);
  }

  private static specFor(
    face: readonly Vector3[],
    index: number,
    rank: number,
    total: number,
    rng: SeededRandom,
  ): ShardSpec {
    const home = ShardField.centroid(face);
    const normal = home.clone().normalize();

    const sideways = ShardField.randomDirection(rng).projectOnPlane(normal);
    if (sideways.lengthSq() < 1e-6) sideways.set(1, 0, 0).projectOnPlane(normal);
    sideways.normalize().multiplyScalar(rng.between(SCATTER_SIDEWAYS.min, SCATTER_SIDEWAYS.max));

    const scatterOffset = normal.clone().multiplyScalar(rng.between(SCATTER_DISTANCE.min, SCATTER_DISTANCE.max)).add(sideways);

    return {
      index,
      home,
      scatterOffset,
      scatterAxis: ShardField.randomDirection(rng),
      scatterAngle: rng.between(SCATTER_ANGLE.min, SCATTER_ANGLE.max),
      windowStart: (LATEST_WINDOW_START * rank) / (total - 1),
      driftPhase: rng.between(0, Math.PI * 2),
      driftRate: rng.between(0.25, 0.55),
    };
  }

  private static randomDirection(rng: SeededRandom): Vector3 {
    const z = rng.between(-1, 1);
    const angle = rng.between(0, Math.PI * 2);
    const ring = Math.sqrt(1 - z * z);
    return new Vector3(ring * Math.cos(angle), ring * Math.sin(angle), z);
  }

  /** Faces sharing an edge, found by matching quantised edge endpoints. */
  private static findNeighbours(faces: readonly (readonly Vector3[])[]): NeighbourPair[] {
    const key = (v: Vector3): string => `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`;
    const firstOwner = new Map<string, number>();
    const pairs: NeighbourPair[] = [];
    faces.forEach((face, index) => {
      for (let k = 0; k < 3; k++) {
        const ends = [key(face[k]), key(face[(k + 1) % 3])].sort().join("|");
        const owner = firstOwner.get(ends);
        if (owner === undefined) firstOwner.set(ends, index);
        else pairs.push([owner, index]);
      }
    });
    return pairs;
  }

  /** Closed prism around the face centre: outer cap, inner cap, three sides, flat normals. */
  private static buildGeometry(face: readonly Vector3[], home: Vector3): BufferGeometry {
    const outer = face.map((v) => v.clone().sub(home).multiplyScalar(FACE_SHRINK));
    const inner = outer.map((o) => o.clone().add(home).multiplyScalar(INNER_RADIUS).sub(home));
    const solidCentre = new Vector3().add(outer[0]).add(outer[1]).add(outer[2]).add(inner[0]).add(inner[1]).add(inner[2]).multiplyScalar(1 / 6);

    const triangles: Array<readonly [Vector3, Vector3, Vector3]> = [[outer[0], outer[1], outer[2]], [inner[0], inner[1], inner[2]]];
    for (let k = 0; k < 3; k++) {
      const next = (k + 1) % 3;
      triangles.push([outer[k], outer[next], inner[next]], [outer[k], inner[next], inner[k]]);
    }

    const positions: number[] = [];
    const edgeA = new Vector3();
    const edgeB = new Vector3();
    const middle = new Vector3();
    for (const [a, b, c] of triangles) {
      const normal = edgeA.subVectors(b, a).cross(edgeB.subVectors(c, a));
      middle.copy(a).add(b).add(c).multiplyScalar(1 / 3).sub(solidCentre);
      const outward = normal.dot(middle) >= 0;
      const [p, q, r] = outward ? [a, b, c] : [a, c, b];
      positions.push(p.x, p.y, p.z, q.x, q.y, q.z, r.x, r.y, r.z);
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    return geometry;
  }
}
