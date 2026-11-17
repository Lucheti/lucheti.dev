import { DirectionalLight, HemisphereLight, Object3D, type Group } from "three";

/** How bright the daylight and the fill are, and their colours. */
export type QueueLightLevels = Readonly<{
  key: number;
  fill: number;
  colors: Readonly<{ key: string; sky: string; ground: string }>;
}>;

/** Where the daylight comes from: high, from the front right, so shadows fall back and left where they show. */
const SUN = { x: 5.5, y: 8, z: 4 } as const;
/** Half the reach of the shadow camera: wide enough for the whole island. */
const SHADOW_REACH = 5.2;

/**
 * The island's lights, inside the island so they turn with it and its baked shadows stay true: warm
 * daylight that casts the shadows, and a sky-and-ground fill so the shade is tinted mint rather than grey.
 */
export class QueueLights {
  private readonly key: DirectionalLight;
  private readonly fill: HemisphereLight;

  public constructor(levels: QueueLightLevels) {
    this.key = new DirectionalLight(levels.colors.key, levels.key);
    this.key.position.set(SUN.x, SUN.y, SUN.z);
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
    camera.far = 30;
    this.key.target = new Object3D();
    this.key.target.position.set(0, 0.5, 0);
    this.fill = new HemisphereLight(levels.colors.sky, levels.colors.ground, levels.fill);
  }

  /** Puts the lights in the island. */
  public attach(island: Group): void {
    island.add(this.key, this.key.target, this.fill);
  }

  /** Frees the shadow map. */
  public dispose(): void {
    this.key.dispose();
  }
}
