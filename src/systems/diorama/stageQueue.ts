import { ButtonPoser } from "./ButtonPoser";
import { SHADOW_SPILL, type QueueDioramaParts } from "./composeQueueDiorama";
import { Approach, IslandLights, IslandRig, point, ToonKit } from "./kit";
import { MachinePoser } from "./MachinePoser";
import { QUEUE_INK, QUEUE_LIGHT, QUEUE_PAINTS } from "./palette";
import { ParcelPoser } from "./ParcelPoser";
import { QueueDirector } from "./QueueDirector";
import { QueueModel } from "./QueueModel";

/** The queue diorama's three.js side, built once in the browser: what the canvas shows and what poses it. */
export type QueueStage = Readonly<{
  model: QueueModel;
  director: QueueDirector;
  /** Frees every geometry, material and texture the stage made. */
  dispose: () => void;
}>;

/** Parcels drawn in the air at once; a flood's extra flights wait their turn to be drawn. */
const FLYING = 24;
/** Smoke puffs over a machine that is down. */
const PUFFS = 5;

/**
 * The WebGL half of the queue diorama's composition root: the look's tuning lives here (the toon bands,
 * the outline, the lights, the island's shadow, the pool sizes), and the model, the lights, the posers and
 * the director are built from the parts, once. Kept apart from `composeQueueDiorama` so three.js loads
 * only with the scene.
 */
export function stageQueue(parts: QueueDioramaParts): QueueStage {
  const { layout, toy } = parts;
  const kit = new ToonKit(QUEUE_PAINTS, { steps: [0.5, 0.7, 0.88, 1], ink: QUEUE_INK, outline: 1.6 });
  const model = new QueueModel(
    layout,
    kit,
    { spill: SHADOW_SPILL, softness: 0.4, color: QUEUE_LIGHT.shadow, opacity: 0.26 },
    { flying: FLYING, pile: parts.pile.capacity(), tray: toy.slots.capacity, puffs: PUFFS },
  );
  const lights = new IslandLights({
    key: 2.0,
    fill: 1.6,
    colors: { key: QUEUE_LIGHT.key, sky: QUEUE_LIGHT.sky, ground: QUEUE_LIGHT.ground },
    sun: point(5.5, 8, 4),
    reach: 5.2,
  });
  lights.attach(model.island());
  const button = layout.button();
  const director = new QueueDirector(
    parts,
    new IslandRig(parts, model.island(), kit, parts.pins),
    new ButtonPoser(model, parts.button, parts.press, { cap: button.cap.pivot, travel: button.travel }, new Approach(0, 14)),
    new MachinePoser(model, layout.machines(), parts.motion, toy.overloadMs / 1000),
    new ParcelPoser(model, parts.pile, parts.drop, parts.tracks, layout.hopper(), layout.beltSlope()),
  );
  return {
    model,
    director,
    dispose: () => {
      lights.dispose();
      model.dispose();
      kit.dispose();
    },
  };
}
