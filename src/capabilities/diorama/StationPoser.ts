import type { StationAction, StationId, StationLook } from "../office";
import { assertNever } from "../office/assertNever";
import { popIn, puffsAt, type Point3 } from "./kit";
import type { OfficeModel } from "./OfficeModel";
import type { PropRigs } from "./OfficeLayout";
import { LAMP_OFF, QA_LAMPS } from "./palette";

/** How far the stamp drops onto the ticket, in island units. */
const STAMP_TRAVEL = 0.3;
/** How far the magnifier sweeps either side of the ticket. */
const SWEEP = 0.2;
/** How fast a finished sketch fades from the easel once the ticket has moved on, per second. */
const SKETCH_FADE = 0.45;
/** How quickly the engineers' screens flicker, in changes a second. */
const FLICKER = 7;

/** The lamp a QA light lights: its index top to bottom, or none. */
function litLamp(light: StationLook["light"]): number | null {
  switch (light) {
    case "off":
      return null;
    case "red":
      return 0;
    case "amber":
      return 1;
    case "green":
      return 2;
    default:
      return assertNever(light);
  }
}

/**
 * Poses the stations' props from how they look: Product's stamp winds up and thumps down, the sketch
 * appears on Design's easel stroke by stroke (and fades once the ticket has gone on), the engineers'
 * screens flicker with code while they type, QA's magnifier sweeps and its light goes amber, then green or
 * red, and Release's rocket rumbles, lifts off on its flame in a billow of smoke and settles back on its pad.
 */
export class StationPoser {
  /** How much of the sketch is on the easel, 0 to 1. */
  private shown = 0;
  private readonly drawnAt: number[];

  public constructor(
    private readonly model: OfficeModel,
    private readonly props: PropRigs,
    /** Seconds a launch takes, to time the smoke. */
    private readonly launchSeconds: number,
  ) {
    this.drawnAt = props.easel.strokes.map(() => Number.NEGATIVE_INFINITY);
  }

  /** Poses every prop for the stations' looks at `now` (seconds), `seconds` after the last frame. */
  public pose(
    looks: Readonly<Record<StationId, StationLook>>,
    actions: Readonly<Record<StationId, StationAction>>,
    now: number,
    seconds: number,
    animate: boolean,
  ): void {
    this.stamp(looks.product);
    this.easel(looks.design, now, seconds, animate);
    this.screens(looks.engineering, now);
    this.qa(looks.qa, now);
    this.rocket(looks.release, actions.release, now);
  }

  private stamp(look: StationLook): void {
    const pivot = this.props.stamp.pivot;
    const group = this.model.stamp();
    group.position.set(pivot.x, pivot.y - look.stamp * STAMP_TRAVEL, pivot.z);
    const squash = look.stamp >= 1 ? 0.12 : 0;
    group.scale.set(1 + squash * 0.5, 1 - squash, 1 + squash * 0.5);
  }

  /** Shows the strokes drawn so far, each popping in as it lands; once the ticket has gone, they fade away. */
  private easel(look: StationLook, now: number, seconds: number, animate: boolean): void {
    const strokes = this.model.strokes();
    const target = look.sketch;
    this.shown = target !== null ? target : animate ? Math.max(0, this.shown - SKETCH_FADE * seconds) : 0;
    strokes.forEach((group, index) => {
      const drawn = this.shown * strokes.length > index + 0.01;
      if (drawn && !group.visible) {
        this.drawnAt[index] = now;
      }
      group.visible = drawn;
      group.scale.setScalar(animate ? popIn(now - this.drawnAt[index]) : 1);
    });
  }

  /** Flickers the screens and scrolls their code while the engineers type; otherwise they glow steady. */
  private screens(look: StationLook, now: number): void {
    const tick = Math.floor(now * FLICKER);
    this.model.screens().forEach((screen, desk) => {
      screen.glass.opacity = look.typing ? 0.55 + 0.3 * (((tick + desk * 5) * 7919) % 10) / 10 : 0.6;
      screen.lines.forEach((line, row) => {
        line.visible = look.typing ? (tick + row * 2 + desk) % 5 !== 0 : row < 2;
      });
    });
  }

  /** Sweeps the magnifier and lights QA's lamps. */
  private qa(look: StationLook, now: number): void {
    const pivot = this.props.magnifier.pivot;
    const lens = this.model.magnifier();
    lens.position.set(pivot.x + look.sweep * SWEEP, pivot.y + 0.02 * Math.sin(now * 2.2), pivot.z + look.sweep * 0.05);
    lens.rotation.z = look.sweep * 0.25;
    const lit = litLamp(look.light);
    const colours = [QA_LAMPS.red, QA_LAMPS.amber, QA_LAMPS.green];
    this.model.lamps().forEach((paint, index) => {
      // Amber blinks while QA looks; a verdict holds steady.
      const on = lit === index && (look.light !== "amber" || Math.floor(now * 3) % 2 === 0);
      paint.color.set(on ? colours[index].color : LAMP_OFF);
      paint.emissive.set(on ? colours[index].glow : "#000000");
    });
  }

  /** Lifts the rocket on its flame and billows smoke across the pad while the engine runs. */
  private rocket(look: StationLook, action: StationAction, now: number): void {
    const pivot = this.props.rocket.pivot;
    const { height, flame, rumble, squash } = look.rocket;
    const rocket = this.model.rocket();
    rocket.position.set(pivot.x + Math.sin(now * 60) * 0.02 * rumble, pivot.y + height, pivot.z);
    rocket.scale.set(1 + squash * 0.12, 1 - squash * 0.18, 1 + squash * 0.12);
    const fire = this.model.flame();
    fire.visible = flame > 0.02;
    fire.scale.set(0.8 + 0.2 * flame, Math.max(0.01, flame * (0.9 + 0.15 * Math.sin(now * 40))), 0.8 + 0.2 * flame);

    const firing = action.kind === "launch" && action.progress > 0.1 && action.progress < 0.75;
    const since = firing ? (action.progress - 0.1) * this.launchSeconds : Number.NEGATIVE_INFINITY;
    const puffs = this.model.puffs();
    const placed = puffsAt(since, puffs.length);
    puffs.forEach((group, index) => {
      const puff = placed[index];
      group.visible = puff !== undefined;
      if (puff !== undefined) {
        const angle = (index / puffs.length) * Math.PI * 2 + 0.4;
        const out: Point3 = this.props.exhaust;
        group.position.set(out.x + Math.cos(angle) * puff.rise * 0.75, out.y + puff.rise * 0.18, out.z + Math.sin(angle) * puff.rise * 0.6);
        group.scale.setScalar(puff.size * 0.85);
      }
    });
  }
}
