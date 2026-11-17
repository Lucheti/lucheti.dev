import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  ConeGeometry,
  DirectionalLight,
  DoubleSide,
  HemisphereLight,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Quaternion,
  SpotLight,
  Vector3,
  type Group,
  type MeshToonMaterial,
} from "three";
import type { LampAnchor } from "./DioramaLayout";
import type { Point3 } from "./space";

type Disposable = Readonly<{ dispose: () => void }>;

/** How bright each light is, and how strongly the lamp's beam and pool show. */
export type LightLevels = Readonly<{
  key: number;
  fill: number;
  lamp: number;
  beam: number;
  pool: number;
  colors: Readonly<{ key: string; sky: string; ground: string; lamp: string }>;
}>;

/**
 * Where the daylight comes from, relative to the island's centre: high and from the open right side, a
 * little to the front, so shadows fall to the left where the camera can see them instead of hiding behind
 * what casts them.
 */
const SUN = new Vector3(5.4, 7.2, 2.2);
const SHADOW_REACH = 3.3;

/** A radial or linear fade drawn once into a small canvas, to use as an alpha map. */
function fadeTexture(kind: "radial" | "linear"): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (context !== null) {
    const gradient =
      kind === "radial" ? context.createRadialGradient(64, 64, 0, 64, 64, 64) : context.createLinearGradient(0, 0, 0, 128);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(kind === "radial" ? 0.55 : 0.35, "#9a9a9a");
    gradient.addColorStop(1, "#000000");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
  }
  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

/**
 * The island's lights, all inside the island so they turn with it and its baked shadows stay true: warm
 * daylight from the front right that casts the shadows, a sky-and-floor fill that tints the shade, and the
 * desk lamp, whose warm spot, soft beam and pool on the desk come and go with its switch.
 */
export class DioramaLights {
  private readonly key: DirectionalLight;
  private readonly fill: HemisphereLight;
  private readonly lamp: SpotLight;
  private readonly beam: Mesh;
  private readonly beamPaint: MeshBasicMaterial;
  private readonly pool: Mesh;
  private readonly poolPaint: MeshBasicMaterial;
  private readonly owned: Disposable[] = [];
  private readonly bulbGlow: Color;

  public constructor(
    anchor: LampAnchor,
    private readonly bulb: MeshToonMaterial,
    private readonly levels: LightLevels,
  ) {
    this.key = new DirectionalLight(levels.colors.key, levels.key);
    this.key.position.copy(SUN);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(2048, 2048);
    this.key.shadow.bias = -0.0005;
    this.key.shadow.normalBias = 0.02;
    this.key.shadow.radius = 4;
    const camera = this.key.shadow.camera;
    camera.left = -SHADOW_REACH;
    camera.right = SHADOW_REACH;
    camera.top = SHADOW_REACH;
    camera.bottom = -SHADOW_REACH;
    camera.near = 1;
    camera.far = 20;
    this.key.target = new Object3D();
    this.key.target.position.set(0, 0.6, 0);

    this.fill = new HemisphereLight(levels.colors.sky, levels.colors.ground, levels.fill);

    this.lamp = new SpotLight(levels.colors.lamp, levels.lamp, 3.2, 0.62, 0.45, 1.6);
    this.lamp.position.set(anchor.bulb.x, anchor.bulb.y, anchor.bulb.z);
    this.lamp.target = new Object3D();
    this.lamp.target.position.set(anchor.aim.x, anchor.aim.y, anchor.aim.z);

    this.beamPaint = this.own(
      new MeshBasicMaterial({
        color: levels.colors.lamp,
        alphaMap: this.own(fadeTexture("linear")),
        transparent: true,
        opacity: levels.beam,
        blending: AdditiveBlending,
        depthWrite: false,
        side: DoubleSide,
      }),
    );
    this.beam = new Mesh(this.own(DioramaLights.beamGeometry(anchor.bulb, anchor.aim, anchor.pool)), this.beamPaint);
    this.beam.raycast = () => undefined;

    this.poolPaint = this.own(
      new MeshBasicMaterial({
        color: levels.colors.lamp,
        alphaMap: this.own(fadeTexture("radial")),
        transparent: true,
        opacity: levels.pool,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    );
    const poolShape = this.own(new PlaneGeometry(anchor.pool * 2.6, anchor.pool * 2.6));
    poolShape.rotateX(-Math.PI / 2);
    this.pool = new Mesh(poolShape, this.poolPaint);
    this.pool.position.set(anchor.aim.x, anchor.aim.y + 0.004, anchor.aim.z);
    this.pool.raycast = () => undefined;
    this.bulbGlow = bulb.emissive.clone();
  }

  /** Puts the lights in the island. */
  public attach(island: Group): void {
    island.add(this.key, this.key.target, this.fill, this.lamp, this.lamp.target, this.beam, this.pool);
  }

  /** The lamp at `level`, 0 off to 1 fully on: its light, its beam, its pool and its bulb's glow. */
  public shine(level: number): void {
    const on = Math.min(1, Math.max(0, level));
    this.lamp.intensity = this.levels.lamp * on;
    this.lamp.visible = on > 0.001;
    this.beamPaint.opacity = this.levels.beam * on;
    this.beam.visible = on > 0.001;
    this.poolPaint.opacity = this.levels.pool * on;
    this.pool.visible = on > 0.001;
    this.bulb.emissive.copy(this.bulbGlow).multiplyScalar(on);
  }

  /** Frees the lights' own geometry, materials and textures. */
  public dispose(): void {
    this.owned.forEach((item) => item.dispose());
    this.owned.length = 0;
    this.key.dispose();
    this.lamp.dispose();
  }

  private own<T extends Disposable>(item: T): T {
    this.owned.push(item);
    return item;
  }

  /** An open cone from the bulb (its tip) to the pool on the desk (its base). */
  private static beamGeometry(bulb: Point3, aim: Point3, pool: number): ConeGeometry {
    const from = new Vector3(aim.x, aim.y, aim.z);
    const to = new Vector3(bulb.x, bulb.y, bulb.z);
    const direction = to.clone().sub(from);
    const geometry = new ConeGeometry(pool * 0.9, direction.length(), 40, 1, true);
    geometry.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize()));
    const middle = from.add(to).multiplyScalar(0.5);
    geometry.translate(middle.x, middle.y, middle.z);
    return geometry;
  }
}
