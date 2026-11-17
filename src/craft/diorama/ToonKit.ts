import { BackSide, Color, DataTexture, MeshToonMaterial, NearestFilter, RedFormat, ShaderMaterial, Vector2 } from "three";
import type { Tone } from "./Solid";
import { HULL_NORMAL } from "./SolidGeometry";
import type { ToonPaint } from "./toon";

type Disposable = Readonly<{ dispose: () => void }>;

/** How the toon look is drawn: the light steps, and the outline's ink and width. */
export type ToonRules = Readonly<{
  /**
   * The brightness of each band of light, from the side facing away from the light to the side facing it,
   * each between 0 and 1. Three or four bands read as cartoon shading.
   */
  steps: readonly number[];
  ink: string;
  /** The outline's width in CSS pixels. */
  outline: number;
}>;

/**
 * The inverted hull: each outlined mesh is drawn again from the inside, its back faces pushed out along the
 * creased normals by a fixed number of pixels on screen, in flat ink. Only the rim shows, as an outline.
 */
const HULL_VERTEX = /* glsl */ `
  attribute vec3 ${HULL_NORMAL};
  uniform float thickness;
  uniform vec2 size;
  void main() {
    vec4 clipPosition = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vec3 viewNormal = normalize(normalMatrix * ${HULL_NORMAL});
    vec2 away = viewNormal.xy;
    float reach = length(away);
    vec2 offset = reach > 1e-4 ? away / reach : vec2(0.0);
    clipPosition.xy += offset * thickness / size * clipPosition.w * 2.0;
    gl_Position = clipPosition;
  }
`;

const HULL_FRAGMENT = /* glsl */ `
  uniform vec3 color;
  void main() {
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

/**
 * The paint shop of the toon look: a stepped gradient made in code (a tiny data texture, nothing fetched),
 * one shared toon material per tone, fresh ones for pieces that change colour, and the ink hull material for
 * outlines, whose width it keeps in screen pixels as the canvas resizes.
 */
export class ToonKit {
  private readonly gradient: DataTexture;
  private readonly shared = new Map<Tone, MeshToonMaterial>();
  private readonly hull: ShaderMaterial;
  private readonly owned: Disposable[] = [];

  public constructor(
    private readonly paints: Readonly<Record<Tone, ToonPaint>>,
    private readonly rules: ToonRules,
  ) {
    if (rules.steps.length < 2 || rules.steps.some((step) => !(step >= 0 && step <= 1))) {
      throw new Error(`A toon gradient needs at least two steps, each from 0 to 1`);
    }
    const texels = Uint8Array.from(rules.steps.map((step) => Math.round(step * 255)));
    this.gradient = this.own(new DataTexture(texels, texels.length, 1, RedFormat));
    this.gradient.minFilter = NearestFilter;
    this.gradient.magFilter = NearestFilter;
    this.gradient.generateMipmaps = false;
    this.gradient.needsUpdate = true;
    this.hull = this.own(
      new ShaderMaterial({
        uniforms: {
          color: { value: new Color(rules.ink) },
          thickness: { value: rules.outline },
          size: { value: new Vector2(1, 1) },
        },
        vertexShader: HULL_VERTEX,
        fragmentShader: HULL_FRAGMENT,
        side: BackSide,
      }),
    );
  }

  /** The shared material for `tone`. */
  public paint(tone: Tone): MeshToonMaterial {
    const existing = this.shared.get(tone);
    if (existing !== undefined) {
      return existing;
    }
    const made = this.fresh(tone);
    this.shared.set(tone, made);
    return made;
  }

  /** A material of its own for `tone`, for a piece whose colour changes. */
  public fresh(tone: Tone): MeshToonMaterial {
    const paint = this.paints[tone];
    return this.own(
      new MeshToonMaterial({
        color: paint.color,
        gradientMap: this.gradient,
        emissive: paint.glow ?? "#000000",
        emissiveIntensity: paint.glow === undefined ? 0 : 1,
      }),
    );
  }

  /** Whether `tone` is drawn with an ink outline. */
  public outlined(tone: Tone): boolean {
    return this.paints[tone].outline;
  }

  /** The ink hull material every outline shares. */
  public outline(): ShaderMaterial {
    return this.hull;
  }

  /** The drawing buffer's size in device pixels and the pixel ratio, so the outline stays the same width on screen. */
  public resize(width: number, height: number, pixelRatio: number): void {
    (this.hull.uniforms.size.value as Vector2).set(Math.max(1, width), Math.max(1, height));
    this.hull.uniforms.thickness.value = this.rules.outline * pixelRatio;
  }

  /** Frees every material and texture made here. */
  public dispose(): void {
    this.owned.forEach((item) => item.dispose());
    this.owned.length = 0;
    this.shared.clear();
  }

  private own<T extends Disposable>(item: T): T {
    this.owned.push(item);
    return item;
  }
}
