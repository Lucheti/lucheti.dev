import { CardBlueprint, LAYER_ORDER } from "../layers/CardBlueprint";
import { HoverTilt } from "../layers/HoverTilt";
import { IsometricView } from "../layers/IsometricView";
import { CameraSway } from "./CameraSway";
import { ExplodeTiming } from "./ExplodeTiming";
import { IdleMotion } from "./IdleMotion";
import { RoomLayout } from "./RoomLayout";
import { RoomScript } from "./RoomScript";
import { RoomShots } from "./RoomShots";
import { RoomSketch } from "./RoomSketch";

/** Everything the workbench room runs on, made once. */
export type Room = Readonly<{
  layout: RoomLayout;
  shots: RoomShots;
  explode: ExplodeTiming;
  script: RoomScript;
  idle: IdleMotion;
  sway: CameraSway;
  /** The pointer's lean over the stage, damped. */
  pointer: HoverTilt;
  sketch: RoomSketch;
  blueprint: CardBlueprint;
}>;

const DEGREE = Math.PI / 180;

/**
 * The composition root of the workbench room: the tuning lives here, and every part is built from it once.
 * The beats: the establishing shot holds and drifts to 0.24 while the heading goes, the dolly reaches the
 * desk at 0.58 with the cards opening on the way, the screen fills the frame at 0.86, and the stage fades
 * to paper over the last few percent.
 */
export function composeRoom(): Room {
  const layout = new RoomLayout();
  const cards = layout.cards().length;
  return {
    layout,
    shots: new RoomShots(layout, {
      wide: { yaw: 45 * DEGREE, pitch: 30 * DEGREE, fov: 22 },
      drift: { yaw: 41 * DEGREE, pitch: 28.5 * DEGREE, fov: 22 },
      approach: { yaw: 22 * DEGREE, pitch: 13 * DEGREE, fov: 28 },
      fill: { fov: 30, share: 0.86 },
      beats: { drift: 0.24, approach: 0.58, fill: 0.86 },
    }),
    explode: new ExplodeTiming({
      cards,
      layers: LAYER_ORDER.length,
      from: 0.28,
      to: 0.5,
      cardStagger: 0.05,
      gapStagger: 0.015,
      closedGap: 0.13,
      openGap: 0.8,
    }),
    script: new RoomScript({
      heading: { from: 0.06, to: 0.26 },
      sway: { from: 0.7, to: 0.84 },
      fade: { from: 0.95, to: 1 },
    }),
    idle: new IdleMotion({ bob: 0.025, bobSeconds: 7, rock: 0.035, flicker: 0.015 }),
    sway: new CameraSway(2.5 * DEGREE, 1.5 * DEGREE),
    pointer: new HoverTilt(3),
    sketch: new RoomSketch(layout, new IsometricView()),
    blueprint: new CardBlueprint(),
  };
}
