import { Group, type Mesh } from "three";
import type { CardBlueprint } from "@/craft/layers/CardBlueprint";
import { StackMeshes } from "@/craft/layers/StackMeshes";
import type { CardSpread } from "./CardSpread";
import type { CardPlacement } from "./DioramaLayout";
import { point, type Point3 } from "./space";

/** The axis the stack's own lean would turn about; the diorama never leans it that way, so any axis does. */
const UNUSED_TILT_AXIS = { x: 1, y: 0, z: 0 } as const;

/**
 * The floating UI card as three.js objects: the Layers model's exploded card (its slabs and marks) hung in
 * a group that tips its face toward the viewer, with a hit box round it. Each frame it opens by an
 * openness and bobs and rocks a little; nothing is rebuilt.
 */
export class FloatingCard {
  private readonly holder = new Group();
  private readonly stack: StackMeshes;

  public constructor(
    blueprint: CardBlueprint,
    private readonly placement: CardPlacement,
    private readonly spread: CardSpread,
    /** Makes the card's hit box round `min`–`max` in the card's own units. */
    hitBox: (min: Point3, max: Point3) => Mesh,
  ) {
    if (blueprint.layers().length !== spread.layers()) {
      throw new Error(`The card has ${blueprint.layers().length} layers but spreads ${spread.layers()}`);
    }
    this.stack = new StackMeshes(blueprint, 1, UNUSED_TILT_AXIS);
    this.stack.ripple(0, 1, 0);
    this.stack.object().traverse((object) => {
      object.raycast = () => undefined;
    });
    const { width, depth } = blueprint.footprint();
    const reach = spread.lift(spread.layers() - 1, 1.6) + 0.2;
    this.holder.rotation.order = "YXZ";
    this.holder.scale.setScalar(placement.scale);
    this.holder.add(this.stack.object());
    this.holder.add(hitBox(point(-width / 2 - 0.15, -reach, -depth / 2 - 0.15), point(width / 2 + 0.15, reach, depth / 2 + 0.15)));
    this.pose(0, 0, 0);
  }

  /** The object to put in the island. */
  public object(): Group {
    return this.holder;
  }

  /** Opens the card to `openness` (0 one card, 1 open, more for the pop), raised by `rise` and rocked by `rock` radians. */
  public pose(openness: number, rise: number, rock: number): void {
    const { at, tilt, yaw } = this.placement;
    this.holder.position.set(at.x, at.y + rise, at.z);
    this.holder.rotation.set(tilt, yaw + rock, 0);
    for (let layer = 0; layer < this.spread.layers(); layer += 1) {
      this.stack.lift(layer, this.spread.lift(layer, openness));
    }
  }

  /** The hairlines are a pixel wide on screen; they need the canvas size in CSS pixels. */
  public resize(width: number, height: number): void {
    this.stack.resize(width, height);
  }

  /** Frees every geometry, material and texture the stack made. */
  public dispose(): void {
    this.stack.dispose();
  }
}
