import { CardBlueprint } from "../layers/CardBlueprint";
import { HoverTilt } from "../layers/HoverTilt";
import { IsometricView } from "../layers/IsometricView";
import { CardSpread } from "./CardSpread";
import { DioramaFraming } from "./DioramaFraming";
import { DioramaLayout } from "./DioramaLayout";
import { DioramaSketch } from "./DioramaSketch";
import { DioramaState } from "./DioramaState";
import { DragGesture } from "./DragGesture";
import { IdleLoops } from "./IdleLoops";
import { PointerCursor } from "./PointerCursor";
import { BrowserClock, Reactions, type Clock } from "./Reactions";
import { corners, point } from "./space";
import { Switchboard, Waker } from "./Switchboard";
import { TurnSpring } from "./TurnSpring";

/** How far the island leans toward the pointer at most, in radians: a turn across and a tip up and down. */
export type LeanReach = Readonly<{ yaw: number; tilt: number }>;

/** Everything the diorama runs on that needs no WebGL, made once. */
export type DioramaParts = Readonly<{
  layout: DioramaLayout;
  state: DioramaState;
  reactions: Reactions;
  switchboard: Switchboard;
  waker: Waker;
  clock: Clock;
  idle: IdleLoops;
  turn: TurnSpring;
  /** The pointer's lean over the island, damped. */
  lean: HoverTilt;
  leanReach: LeanReach;
  gesture: DragGesture;
  cursor: PointerCursor;
  view: IsometricView;
  framing: DioramaFraming;
  sketch: DioramaSketch;
  blueprint: CardBlueprint;
  spread: CardSpread;
}>;

const DEGREE = Math.PI / 180;
/** The camera's fixed three-quarter angle: turned 40° round from the front, looking 30° down. */
const CAMERA_YAW = 40 * DEGREE;
const CAMERA_PITCH = 30 * DEGREE;
/** How far the island turns under a drag, at most. */
const DRAG_REACH = 30 * DEGREE;
/** How far past the plinth the island's soft shadow reaches. */
export const SHADOW_SPILL = 0.45;

/**
 * The composition root of the diorama: the tuning lives here, and every part that needs no WebGL is built
 * from it, once. The scene builds its three.js objects from these parts.
 */
export function composeDiorama(): DioramaParts {
  const layout = new DioramaLayout();
  const clock = new BrowserClock();
  const state = new DioramaState();
  const reactions = new Reactions(clock);
  const waker = new Waker();
  const view = new IsometricView(CAMERA_YAW, CAMERA_PITCH);
  const leanReach: LeanReach = { yaw: 4 * DEGREE, tilt: 3 * DEGREE };
  const blueprint = new CardBlueprint();
  // The shadow's blur has faded out well before the edge of its plane: frame only what shows of it.
  const half = layout.half() + SHADOW_SPILL * 0.4;
  const shadowCorners = [point(-half, layout.bottom(), -half), point(half, layout.bottom(), half), point(-half, layout.bottom(), half), point(half, layout.bottom(), -half)];
  return {
    layout,
    state,
    reactions,
    switchboard: new Switchboard(state, reactions, waker),
    waker,
    clock,
    idle: new IdleLoops({
      puffs: 3,
      steamSeconds: 3.6,
      steamRise: 0.5,
      swaySeconds: 5.5,
      sway: 0.035,
      bobSeconds: 3.2,
      bob: 0.012,
      breatheSeconds: 9,
      cloudSeconds: 22,
      arrivalSeconds: 7,
    }),
    turn: new TurnSpring({ reach: DRAG_REACH, perPixel: 0.006, stiffness: 55, damping: 10 }),
    lean: new HoverTilt(3.5),
    leanReach,
    gesture: new DragGesture(5),
    cursor: new PointerCursor(),
    view,
    framing: new DioramaFraming(view, [...corners(layout.extent()), ...shadowCorners], { yaw: DRAG_REACH + leanReach.yaw, tilt: leanReach.tilt }, 0.02),
    sketch: new DioramaSketch(layout, view),
    blueprint,
    spread: new CardSpread({ layers: blueprint.layers().length, closedGap: 0.14, openGap: 0.75 }),
  };
}
