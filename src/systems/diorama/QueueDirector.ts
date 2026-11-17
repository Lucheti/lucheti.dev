import { OrthographicCamera, Quaternion, Vector2, Vector3, type Camera, type WebGLRenderer } from "three";
import type { ButtonPoser } from "./ButtonPoser";
import type { QueueDioramaParts } from "./composeQueueDiorama";
import type { DioramaBehaviour, ToonKit } from "./kit";
import type { MachinePoser } from "./MachinePoser";
import type { ParcelPoser } from "./ParcelPoser";
import type { QueueModel } from "./QueueModel";

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

/** The longest step the clock takes in one frame, in seconds, so a hitch never jumps the motion ahead. */
const MAX_STEP = 0.1;

/**
 * Runs the queue diorama's frames: frames the camera when the canvas changes shape, turns the island by the
 * drag spring and the pointer's lean, and hands the frame to the posers: the button and kiosk, the
 * machines (from the simulation's latest view), and the parcels (the queue's pile and the flights in the
 * air). The baked shadows are drawn once, on the first frame.
 */
export class QueueDirector {
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
    private readonly parts: QueueDioramaParts,
    private readonly model: QueueModel,
    private readonly kit: ToonKit,
    private readonly button: ButtonPoser,
    private readonly machines: MachinePoser,
    private readonly parcels: ParcelPoser,
  ) {
    const right = parts.view.right();
    this.rightAxis = new Vector3(right.x, right.y, right.z);
  }

  /** Whether the pointer is over the big button. */
  public hover(over: boolean): void {
    this.button.hover(over);
  }

  /** Poses everything for this frame. */
  public frame(input: FrameInput): FrameResult {
    const { behaviour } = input;
    const first = this.first;
    if (first) {
      input.renderer.shadowMap.needsUpdate = true;
      this.first = false;
    }
    const step = Math.min(Math.max(0, input.delta), MAX_STEP);
    const { turn, lean, leanReach, toy, relay, clock } = this.parts;
    if (behaviour.animate) {
      turn.step(step);
    } else if (!turn.held()) {
      turn.home();
    }
    if (!behaviour.parallax) {
      lean.release();
    }
    lean.settle(behaviour.animate ? step : MAX_STEP * 100);
    const island = this.model.island();
    this.yawTurn.setFromAxisAngle(this.upAxis, turn.yaw() + lean.x() * leanReach.yaw);
    this.tiltTurn.setFromAxisAngle(this.rightAxis, -lean.y() * leanReach.tilt);
    island.quaternion.multiplyQuaternions(this.tiltTurn, this.yawTurn);

    if (input.width !== this.width || input.height !== this.height) {
      this.width = input.width;
      this.height = input.height;
      this.reframe(input);
    }

    const view = toy.loop.view();
    const pressing = this.button.pose(step, behaviour.animate);
    this.machines.pose(view.services, clock.now(), step, behaviour.animate);
    this.parcels.pose(view.queued, relay.flights(), behaviour.animate ? step : MAX_STEP * 100);
    this.pinLabels(input);

    const busy = pressing || !turn.resting() || this.parcels.settling();
    return { first, busy };
  }

  /** Fits the camera to the canvas, and keeps the outlines their width in pixels. */
  private reframe(input: FrameInput): void {
    const { camera, renderer, width, height } = input;
    const fit = this.parts.framing.fit(width, height);
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

  /** Moves each HTML label to where its point on the island lands on the canvas. */
  private pinLabels(input: FrameInput): void {
    const { camera, width, height } = input;
    const island = this.model.island();
    island.updateMatrixWorld();
    this.parts.pins.each((anchor, element) => {
      this.pin.set(anchor.x, anchor.y, anchor.z).applyMatrix4(island.matrixWorld).project(camera);
      const x = ((this.pin.x + 1) / 2) * width;
      const y = ((1 - this.pin.y) / 2) * height;
      element.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      element.style.visibility = "visible";
    });
  }
}
