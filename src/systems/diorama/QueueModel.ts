import {
  BoxGeometry,
  CanvasTexture,
  Color,
  Group,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  type BufferGeometry,
  type MeshToonMaterial,
} from "three";
import { point, type Extent, type Point3, type ToonKit } from "./kit";
import { PART, TONE } from "./palette";
import { ParcelPool, type ParcelPaints } from "./ParcelPool";
import type { QueueLayout } from "./QueueLayout";
import { ball, block } from "./shapes";
import { ignorePointer, SolidMeshes } from "./SolidMeshes";

type Disposable = Readonly<{ dispose: () => void }>;

/** The island's soft shadow on the page: how far it reaches past the plinth, how soft it is, and its colour. */
export type GroundShadow = Readonly<{ spill: number; softness: number; color: string; opacity: number }>;

/** How many parcels each pool holds: in the air, piled in the hopper, and on one machine's tray. */
export type PoolSizes = Readonly<{ flying: number; pile: number; tray: number; puffs: number }>;

/** One machine's moving parts. */
export type MachineParts = Readonly<{ body: Group; lamp: MeshToonMaterial; fuse: Group; tray: ParcelPool; puffs: readonly Group[] }>;

/** The pointer's target on the island: only the big button answers. */
export const BUTTON_TARGET = "button";

/** Texels per island unit in the shadow's texture: it is blurred, so this is plenty. */
const SHADOW_TEXELS = 40;

/**
 * The queue island as three.js objects, built once from the layout: the still solids merged by tone, the
 * kiosk, the button's cap and each machine in groups of their own placed at their pivots (so they squash
 * and slump about them), the hopper's glass, pools of parcels and smoke puffs, an invisible hit box on the
 * button and a soft tinted shadow under the plinth. The posers only move groups and change colours.
 */
export class QueueModel {
  private readonly root = new Group();
  private readonly kioskGroup = new Group();
  private readonly capGroup = new Group();
  private readonly machineParts: MachineParts[] = [];
  private readonly flyingPool: ParcelPool;
  private readonly pilePool: ParcelPool;
  private readonly meshes: SolidMeshes;
  private readonly owned: Disposable[] = [];

  public constructor(layout: QueueLayout, kit: ToonKit, shadow: GroundShadow, sizes: PoolSizes) {
    this.meshes = new SolidMeshes(kit);
    const origin = point(0, 0, 0);
    this.meshes.fill(this.root, layout.statics(), origin, true);

    const kiosk = layout.kiosk();
    this.place(this.kioskGroup, kiosk.pivot);
    this.meshes.fill(this.kioskGroup, kiosk.solids, kiosk.pivot, true);

    const button = layout.button();
    this.meshes.fill(this.root, button.housing, origin, true);
    this.place(this.capGroup, button.cap.pivot);
    this.meshes.fill(this.capGroup, button.cap.solids, button.cap.pivot, true);
    this.root.add(this.hitBox(button.hit));

    const paints = this.parcelPaints(layout.parcel(), kit);
    this.flyingPool = new ParcelPool(sizes.flying, paints);
    this.pilePool = new ParcelPool(sizes.pile, paints);
    this.root.add(this.flyingPool.object(), this.pilePool.object());

    const puff = this.meshes.geometry([ball(PART.smoke, TONE.smoke, origin, 1)], origin);
    for (const rig of layout.machines()) {
      const body = new Group();
      this.place(body, rig.body.pivot);
      this.meshes.fill(body, rig.body.solids, rig.body.pivot, true);
      const lamp = this.meshes.tinted(body, rig.lamp.solids, rig.lamp.pivot, TONE.lamp);
      const fuse = new Group();
      fuse.position.set(rig.fuse.pivot.x - rig.body.pivot.x, rig.fuse.pivot.y - rig.body.pivot.y, rig.fuse.pivot.z - rig.body.pivot.z);
      this.meshes.fill(fuse, rig.fuse.solids, rig.fuse.pivot, false);
      body.add(fuse);
      const tray = new ParcelPool(sizes.tray, paints);
      tray.object().position.set(-rig.body.pivot.x, -rig.body.pivot.y, -rig.body.pivot.z);
      body.add(tray.object());
      const puffs = Array.from({ length: sizes.puffs }, () => this.puff(puff, kit));
      this.machineParts.push({ body, lamp, fuse, tray, puffs });
    }

    // The glass goes last, so everything inside it has been drawn before it is laid over them.
    this.root.add(this.glass(layout, kit));
    this.root.add(this.groundShadow(layout, shadow));
  }

  /** The island's root, which turns as a whole. */
  public island(): Group {
    return this.root;
  }

  /** The kiosk, placed at its foot. */
  public kiosk(): Group {
    return this.kioskGroup;
  }

  /** The button's cap, placed at its foot. */
  public cap(): Group {
    return this.capGroup;
  }

  /** Machine `index`'s moving parts. */
  public machine(index: number): MachineParts {
    const parts = this.machineParts[index];
    if (parts === undefined) {
      throw new Error(`No machine ${index}`);
    }
    return parts;
  }

  /** How many machines there are. */
  public machineCount(): number {
    return this.machineParts.length;
  }

  /** The parcels in the air. */
  public flying(): ParcelPool {
    return this.flyingPool;
  }

  /** The parcels piled in the hopper. */
  public pile(): ParcelPool {
    return this.pilePool;
  }

  /** Frees every geometry and material made here (the kit frees its own). */
  public dispose(): void {
    this.meshes.dispose();
    this.owned.forEach((item) => item.dispose());
    this.owned.length = 0;
  }

  private place(group: Group, at: Point3): void {
    group.position.set(at.x, at.y, at.z);
    this.root.add(group);
  }

  /** The parcel's box and its cross of tape, in the two looks. */
  private parcelPaints(size: number, kit: ToonKit): ParcelPaints {
    const origin = point(0, 0, 0);
    const wrap = size * 1.05;
    return {
      box: this.meshes.geometry([block(PART.parcel, TONE.signal, origin, point(size, size, size), size * 0.2)], origin),
      tape: this.meshes.geometry(
        [
          block(PART.parcel, TONE.cream, origin, point(wrap, wrap, size * 0.26), size * 0.08),
          block(PART.parcel, TONE.cream, origin, point(size * 0.26, wrap, wrap), size * 0.08),
        ],
        origin,
      ),
      orange: kit.paint(TONE.signal),
      cream: kit.paint(TONE.cream),
      outline: kit.outline(),
    };
  }

  /** One smoke puff, a unit ball scaled into size by the poser; hidden until a machine smokes. */
  private puff(geometry: BufferGeometry, kit: ToonKit): Group {
    const group = new Group();
    const body = new Mesh(geometry, kit.paint(TONE.smoke));
    const hull = new Mesh(geometry, kit.outline());
    [body, hull].forEach(ignorePointer);
    group.add(body, hull);
    group.visible = false;
    this.root.add(group);
    return group;
  }

  /** The hopper's glass: a pale tint you can see the pile through. */
  private glass(layout: QueueLayout, kit: ToonKit): Mesh {
    const material = kit.fresh(TONE.glass);
    material.transparent = true;
    material.opacity = 0.2;
    material.depthWrite = false;
    const geometry = this.meshes.geometry([layout.glass()], point(0, 0, 0));
    const mesh = new Mesh(geometry, material);
    mesh.renderOrder = 2;
    ignorePointer(mesh);
    return mesh;
  }

  /** An invisible box round `extent` that answers to the pointer as the button. */
  private hitBox(extent: Extent): Mesh {
    const { min, max } = extent;
    const geometry = this.own(new BoxGeometry(max.x - min.x, max.y - min.y, max.z - min.z));
    const mesh = new Mesh(geometry, this.own(new MeshBasicMaterial({ visible: false })));
    mesh.position.set((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);
    mesh.userData.target = BUTTON_TARGET;
    return mesh;
  }

  /** A soft rounded shadow under the plinth, drawn once into a blurred texture. */
  private groundShadow(layout: QueueLayout, shadow: GroundShadow): Mesh {
    const half = layout.half();
    const spanX = 2 * (half.x + shadow.spill);
    const spanZ = 2 * (half.z + shadow.spill);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(spanX * SHADOW_TEXELS);
    canvas.height = Math.round(spanZ * SHADOW_TEXELS);
    const context = canvas.getContext("2d");
    if (context !== null) {
      // Draw the shape far off the canvas and let only its blurred shadow land on it.
      const away = canvas.width * 4;
      const inset = shadow.spill * SHADOW_TEXELS;
      context.shadowColor = "#ffffff";
      context.shadowBlur = shadow.softness * SHADOW_TEXELS;
      context.shadowOffsetX = away;
      context.fillStyle = "#ffffff";
      context.beginPath();
      context.roundRect(inset - away, inset, 2 * half.x * SHADOW_TEXELS, 2 * half.z * SHADOW_TEXELS, 0.7 * SHADOW_TEXELS);
      context.fill();
    }
    const texture = this.own(new CanvasTexture(canvas));
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;
    texture.generateMipmaps = false;
    const geometry = this.own(new PlaneGeometry(spanX, spanZ));
    geometry.rotateX(-Math.PI / 2);
    const material = this.own(
      new MeshBasicMaterial({ color: new Color(shadow.color), alphaMap: texture, transparent: true, opacity: shadow.opacity, depthWrite: false }),
    );
    const mesh = new Mesh(geometry, material);
    mesh.position.set(0.1, layout.bottom() - 0.01, 0.15);
    mesh.renderOrder = -1;
    ignorePointer(mesh);
    return mesh;
  }

  private own<T extends Disposable>(item: T): T {
    this.owned.push(item);
    return item;
  }
}
