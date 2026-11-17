import type { CardBlueprint } from "./CardBlueprint";
import type { IsometricView, Vec2, Vec3 } from "./IsometricView";
import { StageFit, type FitRules, type StageSize } from "./StageFit";
import type { StackChoreography } from "./StackChoreography";

/** How far the pointer may lean the model, in radians, at the panel's edge. */
export type LeanReach = Readonly<{ yaw: number; tilt: number }>;

/**
 * The stack in front of its camera: where it stands at a moment, how it fits a stage, and where each
 * layer's label is pinned. Shared by the WebGL scene, its DOM labels and the SVG fallback, so all three
 * agree to the pixel.
 */
export class StackStage {
  private readonly corner: Vec3 = { x: 0, y: 0, z: 0 };
  private readonly onScreen: Vec2 = { x: 0, y: 0 };

  public constructor(
    private readonly blueprint: CardBlueprint,
    private readonly choreography: StackChoreography,
    private readonly view: IsometricView,
    private readonly rules: FitRules,
    private readonly lean: LeanReach,
  ) {}

  /** The model's turn about the vertical axis at `timeMs`, with the pointer's lean across (−1…1) added. */
  public yaw(timeMs: number, leanX: number): number {
    return this.choreography.sway(timeMs) + leanX * this.lean.yaw;
  }

  /** The model's tilt toward the viewer for the pointer's lean up and down (−1…1). */
  public tilt(leanY: number): number {
    return -leanY * this.lean.tilt;
  }

  /** The fit of the whole breath, at every turn the model may take, into a stage of `size`. */
  public fit(size: StageSize): StageFit {
    const { width, depth } = this.blueprint.footprint();
    const reach = this.choreography.reach();
    const top = reach + this.blueprint.maxThickness();
    const points: Vec3[] = [];
    for (const x of [-width / 2, width / 2]) {
      for (const z of [-depth / 2, depth / 2]) {
        points.push({ x, y: -reach, z }, { x, y: top, z });
      }
    }
    return new StageFit(size, this.view.bounds(points, this.yawReach(), this.lean.tilt), this.rules);
  }

  /** Writes the stage pixel where layer `layer`'s label is pinned: the top-right corner of its top face. */
  public labelPoint(layer: number, timeMs: number, yaw: number, tilt: number, fit: StageFit, out: Vec2): Vec2 {
    const spec = this.blueprint.layers()[layer];
    const anchor = this.blueprint.labelCorner();
    this.corner.x = anchor.u;
    this.corner.y = this.choreography.lift(layer, timeMs) + spec.thickness;
    this.corner.z = anchor.v;
    this.view.project(this.corner, yaw, tilt, this.onScreen);
    return fit.toStage(this.onScreen, out);
  }

  /** The widest yaw the model takes: the sway's reach and the pointer's together. */
  private yawReach(): number {
    return this.choreography.swayReach() + this.lean.yaw;
  }
}
