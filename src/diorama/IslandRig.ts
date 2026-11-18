import { OrthographicCamera, Quaternion, Vector2, Vector3, type Camera, type Group, type WebGLRenderer } from "three";
import type { HoverTilt } from "@/craft/layers/HoverTilt";
import type { IsometricView } from "@/craft/layers/IsometricView";
import type { DioramaFraming } from "./DioramaFraming";
import type { DioramaBehaviour } from "./DioramaMode";
import type { LabelPins } from "./LabelPins";
import type { ToonKit } from "./ToonKit";
import type { TurnSpring } from "./TurnSpring";

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

/** What a frame leaves behind: whether it was the first, and whether something still moves that needs another. */
export type FrameResult = Readonly<{ first: boolean; busy: boolean }>;

/** How far an island leans toward the pointer at most, in radians: a turn across and a tip up and down. */
export type LeanReach = Readonly<{ yaw: number; tilt: number }>;

/** The parts that turn and frame an island: the drag's spring, the pointer's lean, the view and the framing. */
export type IslandHandling = Readonly<{
  turn: TurnSpring;
  lean: HoverTilt;
  leanReach: LeanReach;
  view: IsometricView;
  framing: DioramaFraming;
}>;

/** How this frame went for the rig: whether it was the first, the clock's step, and whether the island still turns. */
export type RigStep = Readonly<{ first: boolean; step: number; turning: boolean }>;

/** The longest step the clock takes in one frame, in seconds, so a hitch never jumps the motion ahead. */
export const MAX_STEP = 0.1;

/**
 * The part of every island's frame that is not about its props: bakes the shadows on the first frame,
 * turns the island by the drag spring and the pointer's lean, frames the camera when the canvas changes
 * shape (keeping the outlines their width in pixels), and moves each HTML label to where its point on the
 * island lands on the canvas.
 */
export class IslandRig<Key extends string> {
  private width = 0;
  private height = 0;
  private first = true;
  private readonly pin = new Vector3();
  private readonly upAxis = new Vector3(0, 1, 0);
  private readonly rightAxis: Vector3;
  private readonly yawTurn = new Quaternion();
  private readonly tiltTurn = new Quaternion();
  private readonly buffer = new Vector2();

  public constructor(
    private readonly handling: IslandHandling,
    private readonly island: Group,
    private readonly kit: ToonKit,
    private readonly pins: LabelPins<Key>,
  ) {
    const right = handling.view.right();
    this.rightAxis = new Vector3(right.x, right.y, right.z);
  }

  /** Turns and frames the island for this frame; the props are posed after it. */
  public frame(input: FrameInput): RigStep {
    const { behaviour } = input;
    const first = this.first;
    if (first) {
      input.renderer.shadowMap.needsUpdate = true;
      this.first = false;
    }
    const step = Math.min(Math.max(0, input.delta), MAX_STEP);
    const { turn, lean, leanReach } = this.handling;
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
    this.island.quaternion.multiplyQuaternions(this.tiltTurn, this.yawTurn);

    if (input.width !== this.width || input.height !== this.height) {
      this.width = input.width;
      this.height = input.height;
      this.reframe(input);
    }
    return { first, step, turning: !turn.resting() };
  }

  /** Moves each HTML label to where its point on the island lands on the canvas. */
  public pinLabels(input: FrameInput): void {
    const { camera, width, height } = input;
    this.island.updateMatrixWorld();
    this.pins.each((anchor, element) => {
      this.pin.set(anchor.x, anchor.y, anchor.z).applyMatrix4(this.island.matrixWorld).project(camera);
      const x = ((this.pin.x + 1) / 2) * width;
      const y = ((1 - this.pin.y) / 2) * height;
      element.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      element.style.visibility = "visible";
    });
  }

  /** Fits the camera to the canvas, and keeps the outlines their width in pixels. */
  private reframe(input: FrameInput): void {
    const { camera, renderer, width, height } = input;
    const fit = this.handling.framing.fit(width, height);
    camera.position.set(fit.position.x, fit.position.y, fit.position.z);
    camera.lookAt(fit.target.x, fit.target.y, fit.target.z);
    if (camera instanceof OrthographicCamera) {
      camera.zoom = fit.zoom;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();
    renderer.getDrawingBufferSize(this.buffer);
    this.kit.resize(this.buffer.x, this.buffer.y, renderer.getPixelRatio());
  }
}
