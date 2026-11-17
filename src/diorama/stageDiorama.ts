import { SHADOW_SPILL, type DioramaParts } from "./composeDiorama";
import { ControlPoser } from "./ControlPoser";
import { DioramaDirector } from "./DioramaDirector";
import { DioramaLights } from "./DioramaLights";
import { DioramaModel } from "./DioramaModel";
import { FloatingCard } from "./FloatingCard";
import { HoverLift } from "./HoverLift";
import { PropPoser } from "./PropPoser";
import { ToonKit } from "./ToonKit";
import { INK, LIGHT, TOON } from "./toon";

/** The diorama's three.js side, built once in the browser: what the canvas shows and what poses it. */
export type DioramaStage = Readonly<{
  model: DioramaModel;
  director: DioramaDirector;
  /** Frees every geometry, material and texture the stage made. */
  dispose: () => void;
}>;

/**
 * The WebGL half of the diorama's composition root: the look's tuning lives here (the toon bands, the
 * outline, the lights, the island's shadow), and the model, the lights, the card and the director are
 * built from the parts, once. Kept apart from `composeDiorama` so three.js loads only with the scene.
 */
export function stageDiorama(parts: DioramaParts): DioramaStage {
  const kit = new ToonKit(TOON, { steps: [0.42, 0.62, 0.84, 1], ink: INK, outline: 1.7 });
  const model = new DioramaModel(parts.layout, kit, { spill: SHADOW_SPILL, softness: 0.35, color: LIGHT.shadow, opacity: 0.22 });
  const card = new FloatingCard(parts.blueprint, parts.layout.card(), parts.spread, (min, max) => model.hitBox(min, max, { kind: "card" }));
  const lights = new DioramaLights(parts.layout.lamp(), kit.paint("bulb"), {
    key: 2.1,
    fill: 1.55,
    lamp: 3.6,
    beam: 0.3,
    pool: 0.85,
    colors: { key: LIGHT.key, sky: LIGHT.sky, ground: LIGHT.ground, lamp: LIGHT.lamp },
  });
  model.island().add(card.object());
  lights.attach(model.island());
  const director = new DioramaDirector(
    parts,
    model,
    kit,
    card,
    new HoverLift(parts.layout, model),
    new ControlPoser(parts.layout, model, lights, parts.state),
    new PropPoser(parts.layout, model, card, parts.idle, parts.state),
  );
  return {
    model,
    director,
    dispose: () => {
      card.dispose();
      lights.dispose();
      model.dispose();
      kit.dispose();
    },
  };
}
