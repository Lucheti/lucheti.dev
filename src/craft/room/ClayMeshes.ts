import {
  CapsuleGeometry,
  CylinderGeometry,
  Euler,
  ExtrudeGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  type BufferGeometry,
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { assertNever } from "../layers/assertNever";
import { CLAY } from "./clay";
import type { ClaySolid, ClayTone, Turn } from "./ClaySolid";
import type { Point3 } from "./space";

/** Tones that light the room rather than catch its light: they cast no shadow. */
const GLOWING: readonly ClayTone[] = ["bulb"];
/** Rounded edges below this radius get fewer segments: nobody sees the bevel of a key cap. */
const FINE_EDGE = 0.012;

type Disposable = Readonly<{ dispose: () => void }>;

/**
 * The room's clay as three.js meshes, built once from the layout: every solid's geometry is made, placed and
 * merged with the others of its tone, so the whole room is one draw call per tone. Matte standard materials,
 * so the environment and the lights do the shading; every mesh casts and receives shadows except the bulb.
 */
export class ClayMeshes {
  private readonly root = new Group();
  private readonly owned: Disposable[] = [];

  public constructor(solids: readonly ClaySolid[]) {
    const byTone = new Map<ClayTone, BufferGeometry[]>();
    for (const solid of solids) {
      byTone.set(solid.tone, [...(byTone.get(solid.tone) ?? []), ClayMeshes.geometry(solid)]);
    }
    byTone.forEach((parts, tone) => {
      const merged = mergeGeometries(parts);
      parts.forEach((part) => part.dispose());
      if (merged === null) {
        throw new Error(`The ${tone} clay could not be merged`);
      }
      const paint = CLAY[tone];
      const material = new MeshStandardMaterial({
        color: paint.color,
        roughness: paint.roughness,
        metalness: 0,
        emissive: paint.glow ?? "#000000",
        emissiveIntensity: paint.glow === undefined ? 0 : 1.6,
      });
      const mesh = new Mesh(this.own(merged), this.own(material));
      mesh.castShadow = !GLOWING.includes(tone);
      mesh.receiveShadow = !GLOWING.includes(tone);
      this.root.add(mesh);
    });
  }

  /** The object to put in the scene. */
  public object(): Group {
    return this.root;
  }

  /** Frees every geometry and material made here. */
  public dispose(): void {
    this.owned.forEach((item) => item.dispose());
    this.owned.length = 0;
  }

  private own<T extends Disposable>(item: T): T {
    this.owned.push(item);
    return item;
  }

  /** One solid's geometry in place, reduced to positions and normals so every solid merges with every other. */
  private static geometry(solid: ClaySolid): BufferGeometry {
    const shaped = ClayMeshes.shaped(solid);
    const flat = shaped.index === null ? shaped : shaped.toNonIndexed();
    if (flat !== shaped) {
      shaped.dispose();
    }
    for (const name of Object.keys(flat.attributes)) {
      if (name !== "position" && name !== "normal") {
        flat.deleteAttribute(name);
      }
    }
    flat.clearGroups();
    return flat;
  }

  /** The solid's own shape, turned and moved into place. */
  private static shaped(solid: ClaySolid): BufferGeometry {
    switch (solid.kind) {
      case "block": {
        const { x, y, z } = solid.size;
        const radius = Math.min(solid.radius, Math.min(x, y, z) / 2 - 1e-4);
        const geometry = new RoundedBoxGeometry(x, y, z, radius < FINE_EDGE ? 2 : 4, Math.max(0, radius));
        return ClayMeshes.place(geometry, solid.at, solid.turn);
      }
      case "drum": {
        const segments = Math.max(solid.top, solid.bottom) < 0.03 ? 14 : 40;
        return ClayMeshes.place(new CylinderGeometry(solid.top, solid.bottom, solid.height, segments), solid.at, solid.turn);
      }
      case "ball": {
        const geometry = new SphereGeometry(solid.radius, 28, 18);
        if (solid.stretch !== undefined) {
          geometry.scale(solid.stretch.x, solid.stretch.y, solid.stretch.z);
        }
        return ClayMeshes.place(geometry, solid.at, solid.turn);
      }
      case "rod": {
        const from = new Vector3(solid.from.x, solid.from.y, solid.from.z);
        const to = new Vector3(solid.to.x, solid.to.y, solid.to.z);
        const direction = to.clone().sub(from);
        const geometry = new CapsuleGeometry(solid.radius, direction.length(), 6, 14);
        geometry.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize()));
        const middle = from.add(to).multiplyScalar(0.5);
        geometry.translate(middle.x, middle.y, middle.z);
        return geometry;
      }
      case "ring":
        return ClayMeshes.place(new TorusGeometry(solid.radius, solid.tube, 12, 28, solid.arc), solid.at, solid.turn);
      case "star": {
        const shape = new Shape();
        for (let corner = 0; corner < 10; corner += 1) {
          const angle = Math.PI / 2 + (corner * Math.PI) / 5;
          const reach = corner % 2 === 0 ? solid.outer : solid.inner;
          const x = Math.cos(angle) * reach;
          const y = Math.sin(angle) * reach;
          if (corner === 0) {
            shape.moveTo(x, y);
          } else {
            shape.lineTo(x, y);
          }
        }
        const bevel = solid.depth * 0.25;
        const geometry = new ExtrudeGeometry(shape, {
          depth: solid.depth - 2 * bevel,
          bevelEnabled: true,
          bevelThickness: bevel,
          bevelSize: bevel * 0.8,
          bevelSegments: 2,
        });
        geometry.translate(0, 0, -(solid.depth - 2 * bevel) / 2);
        return ClayMeshes.place(geometry, solid.at, solid.turn);
      }
      default:
        return assertNever(solid);
    }
  }

  /** Turns a geometry made round the origin by `turn` (an XYZ Euler) and moves it to `at`. */
  private static place(geometry: BufferGeometry, at: Point3, turn?: Turn): BufferGeometry {
    if (turn !== undefined) {
      geometry.applyMatrix4(new Matrix4().makeRotationFromEuler(new Euler(turn.x, turn.y, turn.z)));
    }
    geometry.translate(at.x, at.y, at.z);
    return geometry;
  }
}
