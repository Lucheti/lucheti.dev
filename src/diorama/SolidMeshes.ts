import { Mesh, type BufferGeometry, type Group, type Material, type MeshToonMaterial, type Object3D } from "three";
import type { Solid, Tone } from "./Solid";
import { SolidGeometry } from "./SolidGeometry";
import type { Point3 } from "./space";
import type { ToonKit } from "./ToonKit";

type Disposable = Readonly<{ dispose: () => void }>;

/** Visual meshes never catch the pointer; only hit boxes do. */
export function ignorePointer(object: Object3D): void {
  object.raycast = () => undefined;
}

/**
 * Turns solids into toon meshes: merged by tone into one mesh each, relative to an origin, with an ink
 * outline on every outlined tone. Keeps the geometry it makes, to free it all at once.
 */
export class SolidMeshes {
  private readonly owned: Disposable[] = [];

  public constructor(private readonly kit: ToonKit) {}

  /** Adds `solids` to `group`, merged by tone, placed relative to `origin`, in the shared paints. */
  public fill(group: Group, solids: readonly Solid[], origin: Point3, shadows: boolean): void {
    this.byTone(solids).forEach((parts, tone) => {
      this.add(group, SolidGeometry.merged(parts, origin), this.kit.paint(tone), tone, shadows);
    });
  }

  /**
   * Adds `solids` (all of one tone) to `group` relative to `origin` in a material of their own, for a piece
   * whose colour changes; returns that material.
   */
  public tinted(group: Group, solids: readonly Solid[], origin: Point3, tone: Tone): MeshToonMaterial {
    const material = this.kit.fresh(tone);
    this.add(group, SolidGeometry.merged(solids, origin), material, tone, false);
    return material;
  }

  /** One geometry for `solids`, relative to `origin`, kept to be freed later. */
  public geometry(solids: readonly Solid[], origin: Point3): BufferGeometry {
    return this.own(SolidGeometry.merged(solids, origin));
  }

  /** Frees every geometry made here (the kit frees its materials). */
  public dispose(): void {
    this.owned.forEach((item) => item.dispose());
    this.owned.length = 0;
  }

  private add(group: Group, geometry: BufferGeometry, material: Material, tone: Tone, shadows: boolean): void {
    this.own(geometry);
    const mesh = new Mesh(geometry, material);
    mesh.castShadow = shadows;
    mesh.receiveShadow = true;
    ignorePointer(mesh);
    group.add(mesh);
    if (this.kit.outlined(tone)) {
      const hull = new Mesh(geometry, this.kit.outline());
      ignorePointer(hull);
      group.add(hull);
    }
  }

  private byTone(solids: readonly Solid[]): Map<Tone, Solid[]> {
    const groups = new Map<Tone, Solid[]>();
    for (const solid of solids) {
      groups.set(solid.tone, [...(groups.get(solid.tone) ?? []), solid]);
    }
    return groups;
  }

  private own<T extends Disposable>(item: T): T {
    this.owned.push(item);
    return item;
  }
}
