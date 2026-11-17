import { Group } from "three";
import type { CardBlueprint } from "../layers/CardBlueprint";
import { StackMeshes } from "../layers/StackMeshes";
import type { ExplodeTiming } from "./ExplodeTiming";
import type { IdleMotion } from "./IdleMotion";
import type { CardPlacement } from "./RoomLayout";

/** The axis the stack's own lean would turn about; the room never leans a card that way, so any axis does. */
const UNUSED_TILT_AXIS = { x: 1, y: 0, z: 0 } as const;

/**
 * The floating UI cards as three.js objects: one exploded-card stack (the Layers model's slabs and marks)
 * per placement, hung in a group that tips its face toward the viewer. Each frame the stacks open by the
 * explode timing and bob by the idle motion; nothing is rebuilt.
 */
export class CardStacks {
  private readonly root = new Group();
  private readonly holders: Group[] = [];
  private readonly stacks: StackMeshes[] = [];
  private readonly layers: number;

  public constructor(
    blueprint: CardBlueprint,
    private readonly placements: readonly CardPlacement[],
    private readonly explode: ExplodeTiming,
    private readonly idle: IdleMotion,
  ) {
    if (placements.length !== explode.cards()) {
      throw new Error(`One explode per card: ${placements.length} cards, ${explode.cards()} timings`);
    }
    this.layers = blueprint.layers().length;
    placements.forEach((placement) => {
      const stack = new StackMeshes(blueprint, 1, UNUSED_TILT_AXIS);
      stack.ripple(0, 1, 0);
      const holder = new Group();
      holder.rotation.order = "YXZ";
      holder.scale.setScalar(placement.scale);
      holder.add(stack.object());
      this.holders.push(holder);
      this.stacks.push(stack);
      this.root.add(holder);
    });
  }

  /** The object to put in the scene. */
  public object(): Group {
    return this.root;
  }

  /** Opens every card for scroll progress `p` and, when `alive`, bobs it for the time `seconds`. */
  public pose(p: number, seconds: number, alive: boolean): void {
    this.placements.forEach((placement, card) => {
      const holder = this.holders[card];
      const rise = alive ? this.idle.rise(card, seconds) : 0;
      const rock = alive ? this.idle.rock(card, seconds) : 0;
      holder.position.set(placement.at.x, placement.at.y + rise, placement.at.z);
      holder.rotation.set(placement.tilt, placement.yaw + rock, 0);
      const stack = this.stacks[card];
      for (let layer = 0; layer < this.layers; layer += 1) {
        stack.lift(layer, this.explode.lift(card, layer, p));
      }
    });
  }

  /** The hairlines are a pixel wide on screen; they need the canvas size in CSS pixels. */
  public resize(width: number, height: number): void {
    this.stacks.forEach((stack) => stack.resize(width, height));
  }

  /** Frees every geometry, material and texture the stacks made. */
  public dispose(): void {
    this.stacks.forEach((stack) => stack.dispose());
  }
}
