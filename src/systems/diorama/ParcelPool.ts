import { Group, Mesh, type BufferGeometry, type Material } from "three";
import type { Point3 } from "./kit";
import { ignorePointer } from "./SolidMeshes";

/** The two looks of a parcel: an orange box with cream tape, and a handed-back one in cream with orange tape. */
export type ParcelPaints = Readonly<{
  box: BufferGeometry;
  tape: BufferGeometry;
  orange: Material;
  cream: Material;
  outline: Material;
}>;

type Parcel = Readonly<{ group: Group; box: Mesh; tape: Mesh }>;

/**
 * A fixed pool of parcel meshes in one group, sharing their geometry and paints: each frame the posers
 * place as many as they need, in either look, and the rest are hidden. Nothing is made after the start.
 */
export class ParcelPool {
  private readonly root = new Group();
  private readonly parcels: readonly Parcel[];
  private used = 0;

  public constructor(
    size: number,
    private readonly paints: ParcelPaints,
  ) {
    if (!Number.isInteger(size) || size < 1) {
      throw new Error(`A parcel pool needs at least one parcel: ${size}`);
    }
    this.parcels = Array.from({ length: size }, () => {
      const group = new Group();
      const box = new Mesh(paints.box, paints.orange);
      const tape = new Mesh(paints.tape, paints.cream);
      const hull = new Mesh(paints.box, paints.outline);
      [box, tape, hull].forEach(ignorePointer);
      group.add(box, tape, hull);
      group.visible = false;
      this.root.add(group);
      return { group, box, tape };
    });
  }

  /** The group the pool's parcels live in. */
  public object(): Group {
    return this.root;
  }

  /** Starts a frame: every parcel is free again. */
  public begin(): void {
    this.used = 0;
  }

  /** Puts the next free parcel at `at`, turned `yaw` about its upright and tipped `tip` about its z axis. Returns false once the pool is used up. */
  public place(at: Point3, yaw: number, tip: number, returning: boolean, scale = 1): boolean {
    const parcel = this.parcels[this.used];
    if (parcel === undefined) {
      return false;
    }
    this.used += 1;
    parcel.group.visible = true;
    parcel.group.position.set(at.x, at.y, at.z);
    parcel.group.rotation.set(0, yaw, tip);
    parcel.group.scale.setScalar(scale);
    const box = returning ? this.paints.cream : this.paints.orange;
    if (parcel.box.material !== box) {
      parcel.box.material = box;
      parcel.tape.material = returning ? this.paints.orange : this.paints.cream;
    }
    return true;
  }

  /** Ends a frame: hides every parcel not placed in it. */
  public end(): void {
    for (let index = this.used; index < this.parcels.length; index += 1) {
      this.parcels[index].group.visible = false;
    }
  }
}
