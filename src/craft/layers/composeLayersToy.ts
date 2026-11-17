import { CardBlueprint, LAYER_ORDER } from "./CardBlueprint";
import { FallbackSketch } from "./FallbackSketch";
import { HoverTilt } from "./HoverTilt";
import { IsometricView } from "./IsometricView";
import { LabelBoard } from "./LabelBoard";
import { StackChoreography } from "./StackChoreography";
import { StackStage } from "./StackStage";

/** Everything the Layers panel runs on, made once. */
export type LayersToy = Readonly<{
  blueprint: CardBlueprint;
  choreography: StackChoreography;
  view: IsometricView;
  stage: StackStage;
  sketch: FallbackSketch;
  tilt: HoverTilt;
  labels: LabelBoard;
}>;

const DEGREE = Math.PI / 180;

/** The composition root of the Layers panel: the tuning lives here, and every part is built from it once. */
export function composeLayersToy(): LayersToy {
  const blueprint = new CardBlueprint();
  const choreography = new StackChoreography(
    { stackedMs: 1300, openMs: 2500, explodedMs: 1700, closeMs: 2500, staggerMs: 150, swayMs: 16000, rippleMs: 2000 },
    { layers: LAYER_ORDER.length, stackedGap: 0.13, explodedGap: 0.8, swayRadians: 8 * DEGREE, ripples: 2 },
  );
  const view = new IsometricView();
  const stage = new StackStage(
    blueprint,
    choreography,
    view,
    { padding: 12, leader: 16, labelRoom: 92, maxZoom: 72 },
    { yaw: 5 * DEGREE, tilt: 4 * DEGREE },
  );
  return {
    blueprint,
    choreography,
    view,
    stage,
    sketch: new FallbackSketch(blueprint, choreography, view),
    tilt: new HoverTilt(4),
    labels: new LabelBoard(LAYER_ORDER.length),
  };
}
