import { PerspectiveCamera, type Camera, type SpotLight, type WebGLRenderer } from "three";
import { blankPose, type CameraPath } from "./CameraPath";
import type { CardStacks } from "./CardStacks";
import type { Room } from "./composeRoom";
import type { RoomBehaviour } from "./RoomMode";

/** What one frame needs to know. */
export type FrameInput = Readonly<{
  camera: Camera;
  renderer: WebGLRenderer;
  /** The canvas size in CSS pixels. */
  width: number;
  height: number;
  /** Seconds since the last frame. */
  delta: number;
  /** Scroll progress through the pinned room, 0 to 1. */
  progress: number;
  behaviour: RoomBehaviour;
}>;

/** The longest step the clock takes in one frame, in seconds, so a hitch never jumps the motion ahead. */
const MAX_STEP = 0.1;
/** How quickly the camera catches up with the scroll, per second: a light smoothing, not a lag. */
const FOLLOW = 7;
/** Closer than this, the smoothed progress snaps to the scroll, so a still page settles completely. */
const SNAP = 1e-4;

/**
 * Runs the room's frames: smooths the scroll into the camera path (remade only when the stage changes shape),
 * lets the pointer sway the camera, opens and bobs the cards, wavers the lamp, and asks for the shadow maps
 * once, on the first frame, when everything that casts a shadow is in place.
 */
export class RoomDirector {
  private readonly pose = blankPose();
  private path: CameraPath | null = null;
  private width = 0;
  private height = 0;
  private smoothed: number | null = null;
  private seconds = 0;
  private lamp: SpotLight | null = null;
  private lampLevel = 0;

  public constructor(
    private readonly room: Room,
    private readonly cards: CardStacks,
  ) {}

  /** A callback ref for the desk lamp, whose brightness the director wavers. */
  public readonly attachLamp = (light: SpotLight | null): void => {
    this.lamp = light;
    this.lampLevel = light === null ? 0 : light.intensity;
  };

  /** Poses everything for this frame. Returns true on the first frame, once the scene has something to show. */
  public frame(input: FrameInput): boolean {
    const { camera, behaviour } = input;
    const first = this.path === null;
    if (first) {
      input.renderer.shadowMap.needsUpdate = true;
    }
    if (this.path === null || this.width !== input.width || this.height !== input.height) {
      this.width = input.width;
      this.height = input.height;
      this.path = this.room.shots.path(input.width / Math.max(1, input.height), behaviour.heading);
      this.cards.resize(input.width, input.height);
    }

    const step = Math.min(input.delta, MAX_STEP);
    const wanted = behaviour.scroll ? input.progress : 0;
    const previous = this.smoothed;
    const p = previous === null ? wanted : previous + (wanted - previous) * (1 - Math.exp(-FOLLOW * step));
    this.smoothed = Math.abs(p - wanted) < SNAP ? wanted : p;
    if (behaviour.idle) {
      this.seconds += step;
    }

    const pose = this.path.sample(this.smoothed, this.pose);
    if (behaviour.sway) {
      this.room.pointer.settle(step);
      this.room.sway.apply(pose, this.room.pointer.x(), this.room.pointer.y(), this.room.script.sway(this.smoothed));
    }
    camera.position.set(pose.position.x, pose.position.y, pose.position.z);
    camera.lookAt(pose.target.x, pose.target.y, pose.target.z);
    if (camera instanceof PerspectiveCamera && camera.fov !== pose.fov) {
      camera.fov = pose.fov;
      camera.updateProjectionMatrix();
    }

    this.cards.pose(this.smoothed, this.seconds, behaviour.idle);
    if (this.lamp !== null) {
      this.lamp.intensity = this.lampLevel * (behaviour.idle ? this.room.idle.lamp(this.seconds) : 1);
    }
    return first;
  }
}
