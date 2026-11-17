import { Approach } from "./Approach";
import type { DioramaLayout } from "./DioramaLayout";
import type { DioramaModel } from "./DioramaModel";
import { sameTarget, targetKey, type Target } from "./Target";

/** How quickly a hovered piece lifts and settles back, per second. */
const LIFT_RATE = 14;

/**
 * Puts every moving piece back at rest at the start of a frame, lifted a little if its target is hovered,
 * so the other posers only add their own motion on top. The lift glides in and out.
 */
export class HoverLift {
  private hovered: Target | null = null;
  private readonly levels = new Map<string, Approach>();

  public constructor(
    private readonly layout: DioramaLayout,
    private readonly model: DioramaModel,
  ) {
    for (const hit of layout.hits()) {
      this.levels.set(targetKey(hit.target), new Approach(0, LIFT_RATE));
    }
  }

  /** The pointer is over `target`, or over nothing clickable. */
  public hover(target: Target | null): void {
    this.hovered = target;
  }

  /** Rests every piece, lifting the hovered one. Returns whether a lift is still gliding. */
  public rest(seconds: number, animate: boolean): boolean {
    let busy = false;
    for (const [key, level] of this.levels) {
      const wanted = this.hovered !== null && targetKey(this.hovered) === key ? 1 : 0;
      if (animate) {
        level.toward(wanted, seconds);
      } else {
        level.snap(wanted);
      }
      busy = busy || !level.at(wanted);
    }
    for (const piece of this.layout.pieces()) {
      const group = this.model.piece(piece.id);
      const lifted = piece.target === null ? 0 : (this.levels.get(targetKey(piece.target))?.value() ?? 0);
      group.position.set(piece.pivot.x + piece.lift.x * lifted, piece.pivot.y + piece.lift.y * lifted, piece.pivot.z + piece.lift.z * lifted);
      group.rotation.set(0, 0, 0);
      group.scale.set(1, 1, 1);
      group.visible = true;
    }
    return busy;
  }

  /** Whether `target` is the one hovered. */
  public isHovered(target: Target): boolean {
    return sameTarget(this.hovered, target);
  }
}
