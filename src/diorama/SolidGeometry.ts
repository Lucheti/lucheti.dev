import {
  BufferAttribute,
  CapsuleGeometry,
  CylinderGeometry,
  Euler,
  ExtrudeGeometry,
  Matrix4,
  Quaternion,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  type BufferGeometry,
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries, toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";
import { assertNever } from "@/craft/layers/assertNever";
import type { Solid, Turn } from "./Solid";
import type { Point3 } from "./space";

/**
 * The attribute the ink outline pushes its hull along: the normals averaged across every crease, so a hull
 * pushed out along them never splits at a box's edge or a drum's rim.
 */
export const HULL_NORMAL = "hullNormal";

/** Rounded edges below this radius get fewer segments: nobody sees the bevel of a key cap. */
const FINE_EDGE = 0.02;

/**
 * Turns solids into three.js geometry: each solid shaped, turned and placed (relative to `origin`), reduced to
 * positions, normals and hull normals, and merged into one geometry, so a group of solids draws in one call.
 */
export class SolidGeometry {
  /** The solids merged into one geometry, placed relative to `origin`. */
  public static merged(solids: readonly Solid[], origin: Point3): BufferGeometry {
    const parts = solids.map((solid) => SolidGeometry.one(solid, origin));
    const merged = mergeGeometries(parts);
    parts.forEach((part) => part.dispose());
    if (merged === null) {
      throw new Error(`${solids.length} solids could not be merged`);
    }
    return merged;
  }

  /** One solid's geometry in place, non-indexed, with only the attributes every solid shares. */
  private static one(solid: Solid, origin: Point3): BufferGeometry {
    const shaped = SolidGeometry.shaped(solid);
    shaped.translate(-origin.x, -origin.y, -origin.z);
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
    const creased = toCreasedNormals(flat.clone(), Math.PI);
    flat.setAttribute(HULL_NORMAL, new BufferAttribute(Float32Array.from(creased.getAttribute("normal").array), 3));
    creased.dispose();
    return flat;
  }

  /** The solid's own shape, turned and moved into place. */
  private static shaped(solid: Solid): BufferGeometry {
    switch (solid.kind) {
      case "block": {
        const { x, y, z } = solid.size;
        const radius = Math.min(solid.radius, Math.min(x, y, z) / 2 - 1e-4);
        const geometry = new RoundedBoxGeometry(x, y, z, radius < FINE_EDGE ? 2 : 3, Math.max(0, radius));
        return SolidGeometry.place(geometry, solid.at, solid.turn);
      }
      case "pad":
        return SolidGeometry.place(SolidGeometry.pad(solid.size, solid.corner), solid.at, solid.turn);
      case "drum": {
        const segments = Math.max(solid.top, solid.bottom) < 0.05 ? 14 : 32;
        return SolidGeometry.place(new CylinderGeometry(solid.top, solid.bottom, solid.height, segments), solid.at, solid.turn);
      }
      case "ball": {
        const geometry = new SphereGeometry(solid.radius, 24, 16);
        if (solid.stretch !== undefined) {
          geometry.scale(solid.stretch.x, solid.stretch.y, solid.stretch.z);
        }
        return SolidGeometry.place(geometry, solid.at, solid.turn);
      }
      case "rod": {
        const from = new Vector3(solid.from.x, solid.from.y, solid.from.z);
        const to = new Vector3(solid.to.x, solid.to.y, solid.to.z);
        const direction = to.clone().sub(from);
        const geometry = new CapsuleGeometry(solid.radius, direction.length(), 6, 12);
        geometry.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize()));
        const middle = from.add(to).multiplyScalar(0.5);
        geometry.translate(middle.x, middle.y, middle.z);
        return geometry;
      }
      case "ring":
        return SolidGeometry.place(new TorusGeometry(solid.radius, solid.tube, 12, 24, solid.arc), solid.at, solid.turn);
      case "star":
        return SolidGeometry.place(SolidGeometry.star(solid.outer, solid.inner, solid.depth), solid.at, solid.turn);
      default:
        return assertNever(solid);
    }
  }

  /** A slab with rounded corners in plan, its thickness along y, centred on the origin, its edges softly bevelled. */
  private static pad(size: Point3, corner: number): BufferGeometry {
    const bevel = Math.min(0.012, size.y / 3);
    const halfX = size.x / 2 - bevel;
    const halfZ = size.z / 2 - bevel;
    const r = Math.max(0, Math.min(corner, halfX, halfZ));
    const shape = new Shape();
    shape.moveTo(-halfX + r, -halfZ);
    shape.lineTo(halfX - r, -halfZ);
    shape.quadraticCurveTo(halfX, -halfZ, halfX, -halfZ + r);
    shape.lineTo(halfX, halfZ - r);
    shape.quadraticCurveTo(halfX, halfZ, halfX - r, halfZ);
    shape.lineTo(-halfX + r, halfZ);
    shape.quadraticCurveTo(-halfX, halfZ, -halfX, halfZ - r);
    shape.lineTo(-halfX, -halfZ + r);
    shape.quadraticCurveTo(-halfX, -halfZ, -halfX + r, -halfZ);
    const depth = size.y - 2 * bevel;
    const geometry = new ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 2,
      curveSegments: 10,
    });
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, -depth / 2, 0);
    return geometry;
  }

  /** A five-pointed star with softly bevelled edges, extruded along z and centred on the origin. */
  private static star(outer: number, inner: number, depth: number): BufferGeometry {
    const shape = new Shape();
    for (let corner = 0; corner < 10; corner += 1) {
      const angle = Math.PI / 2 + (corner * Math.PI) / 5;
      const reach = corner % 2 === 0 ? outer : inner;
      const x = Math.cos(angle) * reach;
      const y = Math.sin(angle) * reach;
      if (corner === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }
    const bevel = depth * 0.25;
    const geometry = new ExtrudeGeometry(shape, {
      depth: depth - 2 * bevel,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel * 0.8,
      bevelSegments: 2,
    });
    geometry.translate(0, 0, -(depth - 2 * bevel) / 2);
    return geometry;
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
