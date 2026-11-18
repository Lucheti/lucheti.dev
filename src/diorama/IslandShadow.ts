import { CanvasTexture, Color, LinearFilter, Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace } from "three";
import { ignorePointer } from "./SolidMeshes";

/** An island's soft shadow on the page: how far it reaches past the plinth, how soft it is, and its colour. */
export type GroundShadow = Readonly<{ spill: number; softness: number; color: string; opacity: number }>;

/** The plinth the shadow lies under: its half-size across (x) and front to back (z), and its underside's height. */
export type PlinthPlan = Readonly<{ half: Readonly<{ x: number; z: number }>; bottom: number }>;

/** Texels per island unit in the shadow's texture: it is blurred, so this is plenty. */
const SHADOW_TEXELS = 40;

/**
 * A soft rounded shadow under an island's plinth, drawn once into a blurred texture and laid on the page
 * just below the plinth, nudged a little back and right, away from the light.
 */
export class IslandShadow {
  private readonly mesh: Mesh<PlaneGeometry, MeshBasicMaterial>;
  private readonly texture: CanvasTexture;

  public constructor(plinth: PlinthPlan, shadow: GroundShadow) {
    const { half } = plinth;
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
    this.texture = new CanvasTexture(canvas);
    this.texture.colorSpace = SRGBColorSpace;
    this.texture.minFilter = LinearFilter;
    this.texture.generateMipmaps = false;
    const geometry = new PlaneGeometry(spanX, spanZ);
    geometry.rotateX(-Math.PI / 2);
    const material = new MeshBasicMaterial({
      color: new Color(shadow.color),
      alphaMap: this.texture,
      transparent: true,
      opacity: shadow.opacity,
      depthWrite: false,
    });
    this.mesh = new Mesh(geometry, material);
    this.mesh.position.set(0.1, plinth.bottom - 0.01, 0.15);
    this.mesh.renderOrder = -1;
    ignorePointer(this.mesh);
  }

  /** The shadow's mesh, to add to the island. */
  public object(): Mesh {
    return this.mesh;
  }

  /** Frees its geometry, material and texture. */
  public dispose(): void {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.texture.dispose();
  }
}
