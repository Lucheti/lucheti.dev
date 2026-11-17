import type { QueuePanel } from "@/content";
import { composeQueueToy, FlightRelay, type QueueToy } from "../queue";
import { BigButton, BrowserSeconds, type Seconds } from "./BigButton";
import { ButtonPress } from "./ButtonPress";
import { HopperPile } from "./HopperPile";
import { DioramaFraming, DragGesture, HoverTilt, IsometricView, point, PointerCursor, TurnSpring, Waker, type Point3 } from "./kit";
import { LabelPins, type PinKey } from "./LabelPins";
import { ParcelDrop } from "./ParcelDrop";
import { ParcelTracks } from "./ParcelTracks";
import { QueueLayout } from "./QueueLayout";
import { ServiceMotion } from "./ServiceMotion";

/** How far the island leans toward the pointer at most, in radians: a turn across and a tip up and down. */
export type LeanReach = Readonly<{ yaw: number; tilt: number }>;

/** Everything the queue diorama runs on that needs no WebGL, made once. */
export type QueueDioramaParts = Readonly<{
  toy: QueueToy;
  /** The flights of each frame, for the 3D parcels. */
  relay: FlightRelay;
  layout: QueueLayout;
  tracks: ParcelTracks;
  pile: HopperPile;
  drop: ParcelDrop;
  motion: ServiceMotion;
  button: BigButton;
  press: ButtonPress;
  clock: Seconds;
  waker: Waker;
  turn: TurnSpring;
  lean: HoverTilt;
  leanReach: LeanReach;
  gesture: DragGesture;
  cursor: PointerCursor;
  view: IsometricView;
  framing: DioramaFraming;
  /** The HTML labels pinned to the island. */
  pins: LabelPins;
}>;

const DEGREE = Math.PI / 180;
/** The camera's fixed three-quarter angle: turned 34° round from the front, looking 30° down. */
const CAMERA_YAW = 34 * DEGREE;
const CAMERA_PITCH = 30 * DEGREE;
/** How far the island turns under a drag, at most. */
const DRAG_REACH = 30 * DEGREE;
/** How far past the plinth the island's soft shadow reaches. */
export const SHADOW_SPILL = 0.5;
/** Gravity in the hopper, in island units per second squared: brisk, so a pile builds without lag. */
const GRAVITY = 26;

/**
 * The composition root of the queue diorama: the toy (the same simulation the 2D board runs, with a relay
 * for the 3D parcels), and every part of the 3D scene that needs no WebGL, built once from the tuning here.
 */
export function composeQueueDiorama(panel: QueuePanel): QueueDioramaParts {
  const relay = new FlightRelay();
  const toy = composeQueueToy(
    panel.services.map((service) => service.name),
    panel.announcements,
    [relay],
  );
  const layout = new QueueLayout();
  const hopper = layout.hopper();
  const clock = new BrowserSeconds();
  const waker = new Waker();
  const view = new IsometricView(CAMERA_YAW, CAMERA_PITCH);
  const leanReach: LeanReach = { yaw: 4 * DEGREE, tilt: 3 * DEGREE };
  // The shadow's blur has faded out well before the edge of its plane: frame only what shows of it.
  const half = layout.half();
  const spill = SHADOW_SPILL * 0.4;
  const bottom = layout.bottom();
  const shadowCorners = [-1, 1].flatMap((x) => [-1, 1].map((z) => point(x * (half.x + spill), bottom, z * (half.z + spill))));
  const framed = [...layout.silhouette(), ...shadowCorners];
  return {
    toy,
    relay,
    layout,
    tracks: new ParcelTracks(layout.tracks()),
    pile: new HopperPile(hopper.levels, hopper.fillOrder),
    drop: new ParcelDrop(GRAVITY, layout.tracks().mouth.y),
    motion: new ServiceMotion(),
    button: new BigButton(toy.loop, panel.send.count, clock, waker),
    press: new ButtonPress({ push: 0.07, hold: 0.07, frequency: 2.6, decay: 6.5, squash: 0.38 }),
    clock,
    waker,
    turn: new TurnSpring({ reach: DRAG_REACH, perPixel: 0.006, stiffness: 55, damping: 10 }),
    lean: new HoverTilt(3.5),
    leanReach,
    gesture: new DragGesture(5),
    cursor: new PointerCursor(),
    view,
    framing: new DioramaFraming(view, framed, { yaw: DRAG_REACH + leanReach.yaw, tilt: leanReach.tilt }, 0.015),
    pins: new LabelPins(pinPoints(layout)),
  };
}

/** Where each label is pinned on the island. */
function pinPoints(layout: QueueLayout): ReadonlyMap<PinKey, Point3> {
  const labels = layout.labels();
  const points = new Map<PinKey, Point3>([
    ["kiosk", labels.kiosk],
    ["button", labels.button],
    ["broker", labels.broker],
    ["overflow", labels.overflow],
  ]);
  layout.machines().forEach((machine, index) => {
    points.set(`sign-${index}`, machine.sign);
    points.set(`screen-${index}`, machine.screen);
  });
  return points;
}
