import { Color } from "three";
import { Approach } from "./Approach";
import { pulse, ring, squash } from "./curves";
import type { DioramaLayout, StarPiece } from "./DioramaLayout";
import type { DioramaLights } from "./DioramaLights";
import type { DioramaModel } from "./DioramaModel";
import { DENSITIES, type DioramaState } from "./DioramaState";
import { STAR_COUNT, type TargetKind } from "./Target";
import { TINTS } from "./toon";

/** How quickly each control glides to its new state, per second. */
const RATES = { knob: 10, slider: 11, star: 12, tick: 14, lamp: 7 } as const;

/**
 * Poses the pegboard's controls and the lamp from the diorama's state: the toggle's knob slides and turns
 * from sun to moon, the button's cap sinks and springs back, the slider's knob steps, the stars light up in
 * turn with a pop, the tick pops into the checkbox, and the lamp warms up or cools down. Each change glides
 * (or, under reduced motion, lands at once), and every click adds its little squash.
 */
export class ControlPoser {
  private readonly knob = new Approach(0, RATES.knob);
  private readonly slider: Approach;
  private readonly stars: Approach[];
  private readonly tick = new Approach(0, RATES.tick);
  private readonly lamp = new Approach(1, RATES.lamp);
  private readonly sun = new Color(TINTS.sun);
  private readonly moon = new Color(TINTS.moon);
  private readonly starOff = new Color(TINTS.starOff);
  private readonly starOn = new Color(TINTS.starOn);
  private readonly mixed = new Color();

  public constructor(
    private readonly layout: DioramaLayout,
    private readonly model: DioramaModel,
    private readonly lights: DioramaLights,
    private readonly state: DioramaState,
  ) {
    const view = state.snapshot();
    this.slider = new Approach(layout.sliderStops()[DENSITIES.indexOf(view.density)], RATES.slider);
    this.stars = Array.from({ length: STAR_COUNT }, (_, index) => new Approach(index < view.rating ? 1 : 0, RATES.star));
    this.tick.snap(view.done ? 1 : 0);
    this.lamp.snap(view.lampOn ? 1 : 0);
  }

  /** Poses the controls `seconds` on. `age` gives each reaction's age (infinite when reactions are off). Returns whether anything is still moving. */
  public pose(seconds: number, animate: boolean, age: (kind: TargetKind) => number): boolean {
    const view = this.state.snapshot();
    const move = (value: Approach, target: number): number => (animate ? value.toward(target, seconds) : value.snap(target));
    let busy = false;
    const settle = (value: Approach, target: number): number => {
      const now = move(value, target);
      busy = busy || !value.at(target);
      return now;
    };

    const flip = settle(this.knob, view.theme === "dark" ? 1 : 0);
    const knob = this.model.piece("toggle-knob");
    knob.position.x += flip * 2 * this.layout.toggleTravel();
    const knobSquash = squash(age("toggle"), 0.3);
    knob.scale.set(knobSquash.tall, knobSquash.wide, 1);
    this.model.tint("toggle-knob", this.mixed.lerpColors(this.sun, this.moon, flip));
    const track = squash(age("toggle"), 0.08);
    this.model.piece("toggle-track").scale.set(track.wide, track.tall, 1);

    const press = Math.min(1, pulse(age("button"), 0.03, 0.16) * 1.5);
    const cap = this.model.piece("button-cap");
    cap.position.z -= press * this.layout.buttonDepth();
    cap.scale.set(1 + 0.12 * press, 1 + 0.12 * press, 1 - 0.35 * press);

    const stop = settle(this.slider, this.layout.sliderStops()[DENSITIES.indexOf(view.density)]);
    const slider = this.model.piece("slider-knob");
    slider.position.x += stop;
    const sliderSquash = squash(age("slider"), 0.28);
    slider.scale.set(sliderSquash.tall, sliderSquash.wide, 1);

    for (let index = 0; index < STAR_COUNT; index += 1) {
      const id = `star-${index + 1}` as StarPiece;
      const lit = settle(this.stars[index], index < view.rating ? 1 : 0);
      this.model.tint(id, this.mixed.lerpColors(this.starOff, this.starOn, lit));
      const star = this.model.piece(id);
      const pop = 1 + 0.32 * ring(age("star") - index * 0.06, 2.2, 5);
      star.scale.setScalar(pop);
      star.position.z += 0.025 * lit;
      star.rotation.z = 0.25 * ring(age("star") - index * 0.06, 1.6, 4);
    }

    const done = settle(this.tick, view.done ? 1 : 0);
    const tick = this.model.piece("checkbox-tick");
    tick.scale.setScalar(Math.max(1e-4, done * (1 + 0.35 * ring(age("checkbox"), 2.4, 5))));
    tick.visible = done > 0.002;
    const box = squash(age("checkbox"), 0.18);
    this.model.piece("checkbox-box").scale.set(box.wide, box.tall, 1);

    this.lights.shine(settle(this.lamp, view.lampOn ? 1 : 0));
    this.model.piece("lamp-head").rotation.x = 0.35 * ring(age("lamp"), 2, 3.5);
    return busy;
  }
}
