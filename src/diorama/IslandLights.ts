import { DirectionalLight, HemisphereLight, Object3D, type Group } from "three";
import type { Point3 } from "./space";

/** How bright the daylight and the fill are, their colours, where the sun stands and how far its shadows reach. */
export type IslandLightLevels = Readonly<{
  key: number;
  fill: number;
  colors: Readonly<{ key: string; sky: string; ground: string }>;
  /** Where the daylight comes from, in island units. */
  sun: Point3;
  /** Half the reach of the shadow camera: wide enough for the whole island. */
  reach: number;
}>;

/**
 * An island's lights, inside the island so they turn with it and its baked shadows stay true: warm
 * daylight that casts the shadows, and a sky-and-ground fill so the shade is tinted rather than grey.
 */
export class IslandLights {
  private readonly key: DirectionalLight;
  private readonly fill: HemisphereLight;

  public constructor(levels: IslandLightLevels) {
    this.key = new DirectionalLight(levels.colors.key, levels.key);
    this.key.position.set(levels.sun.x, levels.sun.y, levels.sun.z);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(2048, 2048);
    this.key.shadow.bias = -0.0005;
    this.key.shadow.normalBias = 0.02;
    this.key.shadow.radius = 4;
    const camera = this.key.shadow.camera;
    camera.left = -levels.reach;
    camera.right = levels.reach;
    camera.top = levels.reach;
    camera.bottom = -levels.reach;
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
