import { OrthographicCamera, Quaternion, Vector2, Vector3, type Camera, type WebGLRenderer } from "three";
import type { DioramaParts } from "./composeDiorama";
import type { ControlPoser } from "./ControlPoser";
import type { DioramaBehaviour } from "./DioramaMode";
import type { DioramaModel } from "./DioramaModel";
import type { FloatingCard } from "./FloatingCard";
import type { HoverLift } from "./HoverLift";
import type { PropPoser } from "./PropPoser";
import type { Target, TargetKind } from "./Target";
import type { ToonKit } from "./ToonKit";

/** What one frame needs to know. */
export type FrameInput = Readonly<{
  camera: Camera;
  renderer: WebGLRenderer;
  /** The canvas size in CSS pixels. */
  width: number;
  height: number;
  /** Seconds since the last frame. */
  delta: number;
  behaviour: DioramaBehaviour;
}>;

/** What a frame leaves behind: whether it was the first, and whether something is still moving that needs another. */
export type FrameResult = Readonly<{ first: boolean; busy: boolean }>;

/** The longest step the clock takes in one frame, in seconds, so a hitch never jumps the motion ahead. */
const MAX_STEP = 0.1;

/**
 * Runs the diorama's frames: frames the camera when the canvas changes shape, turns the island by the drag
 * spring and the pointer's lean, rests every piece and lifts the hovered one, poses the controls from the
 * state and the props from the idle life and the reactions, and asks for the baked shadows once, on the
 * first frame, when everything that casts one is in place.
 */
export class DioramaDirector {
  private width = 0;
  private height = 0;
  private first = true;
  private idleSeconds = 0;
  private readonly upAxis = new Vector3(0, 1, 0);
  private readonly rightAxis: Vector3;
  private readonly yawTurn = new Quaternion();
  private readonly tiltTurn = new Quaternion();
  private readonly buffer = new Vector2();

  public constructor(
    private readonly parts: DioramaParts,
    private readonly model: DioramaModel,
    private readonly kit: ToonKit,
    private readonly card: FloatingCard,
    private readonly lift: HoverLift,
    private readonly controls: ControlPoser,
    private readonly props: PropPoser,
  ) {
    const right = parts.view.right();
    this.rightAxis = new Vector3(right.x, right.y, right.z);
  }

  /** The pointer is over `target`, or over nothing clickable. */
  public hover(target: Target | null): void {
    this.lift.hover(target);
  }

  /** Poses everything for this frame. */
  public frame(input: FrameInput): FrameResult {
    const { behaviour } = input;
    const first = this.first;
    if (first) {
      input.renderer.shadowMap.needsUpdate = true;
      this.first = false;
    }
    if (input.width !== this.width || input.height !== this.height) {
      this.width = input.width;
      this.height = input.height;
      this.reframe(input);
    }

    const step = Math.min(Math.max(0, input.delta), MAX_STEP);
    if (behaviour.idle) {
      this.idleSeconds += step;
    }
    const { turn, lean, leanReach, reactions } = this.parts;
    if (behaviour.animate) {
      turn.step(step);
    } else if (!turn.held()) {
      turn.home();
    }
    if (!behaviour.parallax) {
      lean.release();
    }
    lean.settle(behaviour.animate ? step : MAX_STEP * 100);
    this.yawTurn.setFromAxisAngle(this.upAxis, turn.yaw() + lean.x() * leanReach.yaw);
    this.tiltTurn.setFromAxisAngle(this.rightAxis, -lean.y() * leanReach.tilt);
    this.model.island().quaternion.multiplyQuaternions(this.tiltTurn, this.yawTurn);

    const age = (kind: TargetKind): number => (behaviour.animate ? reactions.age(kind) : Number.POSITIVE_INFINITY);
    const lifting = this.lift.rest(step, behaviour.animate);
    const moving = this.controls.pose(step, behaviour.animate, age);
    this.props.pose(this.idleSeconds, behaviour.idle, age);

    const busy = lifting || moving || !turn.resting() || (behaviour.animate && reactions.lively());
    return { first, busy };
  }

  /** Fits the camera to the canvas, and keeps the outlines and hairlines their width in pixels. */
  private reframe(input: FrameInput): void {
    const { camera, renderer, width, height } = input;
    const fit = this.parts.framing.fit(width, height);
    camera.position.set(fit.position.x, fit.position.y, fit.position.z);
    camera.lookAt(fit.target.x, fit.target.y, fit.target.z);
    if (camera instanceof OrthographicCamera) {
      camera.zoom = fit.zoom;
      camera.updateProjectionMatrix();
    }
    renderer.getDrawingBufferSize(this.buffer);
    this.kit.resize(this.buffer.x, this.buffer.y, renderer.getPixelRatio());
    this.card.resize(width, height);
  }
}
