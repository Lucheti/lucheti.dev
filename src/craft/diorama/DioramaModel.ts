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
  type Object3D,
} from "three";
import type { DioramaLayout, Piece, PieceId } from "./DioramaLayout";
import type { Solid, Tone } from "./Solid";
import { SolidGeometry } from "./SolidGeometry";
import { point, type Point3 } from "./space";
import type { Target } from "./Target";
import type { ToonKit } from "./ToonKit";

type Disposable = Readonly<{ dispose: () => void }>;

/** The island's soft shadow on the page: how far it reaches past the footprint, how soft it is, and its colour. */
export type GroundShadow = Readonly<{ spill: number; softness: number; color: string; opacity: number }>;

/** Texels per island unit in the shadow's texture: it is blurred, so this is plenty. */
const SHADOW_TEXELS = 48;

/** Visual meshes never catch the pointer; only the hit boxes do. */
function ignorePointer(object: Object3D): void {
  object.raycast = () => undefined;
}

/**
 * The island as three.js objects, built once from the layout: the still solids merged into one mesh per
 * tone, each moving piece in a group of its own placed at its pivot (so it turns and squashes about it),
 * an ink outline hull on every outlined tone, an invisible hit box per clickable target, and a soft tinted
 * shadow under the plinth. The director only moves groups and changes colours; nothing is rebuilt.
 */
export class DioramaModel {
  private readonly root = new Group();
  private readonly groups = new Map<PieceId, Group>();
  private readonly tinted = new Map<PieceId, MeshToonMaterial[]>();
  private readonly owned: Disposable[] = [];

  public constructor(
    private readonly layout: DioramaLayout,
    private readonly kit: ToonKit,
    shadow: GroundShadow,
  ) {
    this.addSolids(this.root, layout.statics(), point(0, 0, 0), null);
    for (const piece of layout.pieces()) {
      const group = new Group();
      group.position.set(piece.pivot.x, piece.pivot.y, piece.pivot.z);
      this.addSolids(group, piece.solids, piece.pivot, piece);
      this.groups.set(piece.id, group);
      this.root.add(group);
    }
    for (const hit of layout.hits()) {
      this.root.add(this.hitBox(hit.extent.min, hit.extent.max, hit.target));
    }
    this.root.add(this.groundShadow(shadow));
  }

  /** The island's root, which turns as a whole. */
  public island(): Group {
    return this.root;
  }

  /** A piece's group. */
  public piece(id: PieceId): Group {
    const group = this.groups.get(id);
    if (group === undefined) {
      throw new Error(`No piece ${id}`);
    }
    return group;
  }

  /** Puts a tinted piece in `color`. */
  public tint(id: PieceId, color: Color): void {
    for (const material of this.tinted.get(id) ?? []) {
      material.color.copy(color);
    }
  }

  /** A hit box round `min`–`max` (in the space of whatever it is added to) that answers to `target`. */
  public hitBox(min: Point3, max: Point3, target: Target): Mesh {
    const geometry = this.own(new BoxGeometry(max.x - min.x, max.y - min.y, max.z - min.z));
    const mesh = new Mesh(geometry, this.own(new MeshBasicMaterial({ visible: false })));
    mesh.position.set((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);
    mesh.userData.target = target;
    return mesh;
  }

  /** Frees every geometry and material made here (the kit frees its own). */
  public dispose(): void {
    this.owned.forEach((item) => item.dispose());
    this.owned.length = 0;
  }

  /** Merges `solids` by tone into `group`, relative to `origin`, each with its outline. */
  private addSolids(group: Group, solids: readonly Solid[], origin: Point3, piece: Piece | null): void {
    const byTone = new Map<Tone, Solid[]>();
    for (const solid of solids) {
      byTone.set(solid.tone, [...(byTone.get(solid.tone) ?? []), solid]);
    }
    byTone.forEach((parts, tone) => {
      const geometry: BufferGeometry = this.own(SolidGeometry.merged(parts, origin));
      const material = piece !== null && piece.tinted ? this.kit.fresh(tone) : this.kit.paint(tone);
      if (piece !== null && piece.tinted) {
        this.tinted.set(piece.id, [...(this.tinted.get(piece.id) ?? []), material]);
      }
      const mesh = new Mesh(geometry, material);
      const glowing = tone === "bulb";
      mesh.castShadow = !glowing && tone !== "cloud";
      mesh.receiveShadow = !glowing;
      ignorePointer(mesh);
      group.add(mesh);
      if (this.kit.outlined(tone)) {
        const hull = new Mesh(geometry, this.kit.outline());
        ignorePointer(hull);
        group.add(hull);
      }
    });
  }

  /** A soft rounded-square shadow under the plinth, drawn once into a blurred texture. */
  private groundShadow(shadow: GroundShadow): Mesh {
    const half = this.layout.half();
    const span = 2 * (half + shadow.spill);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(span * SHADOW_TEXELS);
    canvas.height = canvas.width;
    const context = canvas.getContext("2d");
    if (context !== null) {
      // Draw the square far off the canvas and let only its blurred shadow land on it.
      const away = canvas.width * 4;
      const inset = shadow.spill * SHADOW_TEXELS;
      const size = 2 * half * SHADOW_TEXELS;
      context.shadowColor = "#ffffff";
      context.shadowBlur = shadow.softness * SHADOW_TEXELS;
      context.shadowOffsetX = away;
      context.fillStyle = "#ffffff";
      context.beginPath();
      context.roundRect(inset - away, inset, size, size, 0.3 * SHADOW_TEXELS);
      context.fill();
    }
    const texture = this.own(new CanvasTexture(canvas));
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;
    texture.generateMipmaps = false;
    const geometry = this.own(new PlaneGeometry(span, span));
    geometry.rotateX(-Math.PI / 2);
    const material = this.own(
      new MeshBasicMaterial({ color: new Color(shadow.color), alphaMap: texture, transparent: true, opacity: shadow.opacity, depthWrite: false }),
    );
    const mesh = new Mesh(geometry, material);
    mesh.position.set(0.08, this.layout.bottom() - 0.01, 0.12);
    mesh.renderOrder = -1;
    ignorePointer(mesh);
    return mesh;
  }

  private own<T extends Disposable>(item: T): T {
    this.owned.push(item);
    return item;
  }
}
