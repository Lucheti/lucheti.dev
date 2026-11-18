import { OFFICE_TIMING } from "../office";
import { CapPoser } from "./CapPoser";
import { SHADOW_SPILL, type OfficeDioramaParts } from "./composeOfficeDiorama";
import { Approach, IslandLights, IslandRig, point, ToonKit } from "./kit";
import { OfficeDirector } from "./OfficeDirector";
import { TRAY_SHOWN } from "./OfficeLayout";
import { OfficeModel } from "./OfficeModel";
import { BOUNCED_CARD, OFFICE_INK, OFFICE_LIGHT, OFFICE_PAINTS, TICKET_CARD } from "./palette";
import { RobotPoser } from "./RobotPoser";
import { StationPoser } from "./StationPoser";
import { TicketPoser } from "./TicketPoser";

/** The office diorama's three.js side, built once in the browser: what the canvas shows and what poses it. */
export type OfficeStage = Readonly<{
  model: OfficeModel;
  director: OfficeDirector;
  /** Frees every geometry, material and texture the stage made. */
  dispose: () => void;
}>;

/** Cards drawn on the floor at once: two tickets, each split in three at most. */
const CARDS = 6;
/** Smoke puffs under the rocket. */
const PUFFS = 7;

/**
 * The WebGL half of the office diorama's composition root: the look's tuning lives here (the toon bands,
 * the outline, the lights, the island's shadow, the pool sizes), and the model, the lights, the posers and
 * the director are built from the parts, once. Kept apart from `composeOfficeDiorama` so three.js loads
 * only with the scene.
 */
export function stageOffice(parts: OfficeDioramaParts): OfficeStage {
  const { layout } = parts;
  const kit = new ToonKit(OFFICE_PAINTS, { steps: [0.52, 0.72, 0.88, 1], ink: OFFICE_INK, outline: 1.6 });
  const model = new OfficeModel(
    layout,
    kit,
    { spill: SHADOW_SPILL, softness: 0.4, color: OFFICE_LIGHT.shadow, opacity: 0.26 },
    { cards: CARDS, tray: TRAY_SHOWN, puffs: PUFFS },
  );
  const lights = new IslandLights({
    key: 2.0,
    fill: 1.6,
    colors: { key: OFFICE_LIGHT.key, sky: OFFICE_LIGHT.sky, ground: OFFICE_LIGHT.ground },
    sun: point(5.5, 8, 4),
    reach: 5.6,
  });
  lights.attach(model.island());
  const button = layout.button();
  const director = new OfficeDirector(
    parts,
    new IslandRig(parts, model.island(), kit, parts.pins),
    new CapPoser(model.cap(), parts.button, parts.press, { foot: button.cap.pivot, travel: button.travel }, new Approach(0, 14)),
    new RobotPoser(model, layout.robots()),
    new StationPoser(model, layout.props(), OFFICE_TIMING.launch),
    new TicketPoser(model, parts.path, { fresh: TICKET_CARD, bounced: BOUNCED_CARD }, layout.spots().inbox, TRAY_SHOWN),
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
