import type { StationId } from "../office";
import { arcadeButton, ball, block, drum, lerp, offset, pad, point, rod, torus, type ButtonRig, type Point3, type Solid, type Tone } from "./kit";
import { PART, TONE } from "./palette";

/** A group of solids modelled about its own origin, placed on the island at `at` and turned `yaw` about the upright. */
export type Placed = Readonly<{ at: Point3; yaw: number; solids: readonly Solid[] }>;

/** A part of a placed group that moves on its own, modelled about `pivot` in the group's space. */
export type Joint = Readonly<{ pivot: Point3; solids: readonly Solid[] }>;

/** One robot: where it stands and faces, its still body, and its head, eyes and arms that move. */
export type RobotRig = Readonly<{
  station: StationId;
  at: Point3;
  yaw: number;
  body: readonly Solid[];
  head: Joint;
  /** The eyes, inside the head's space; the poser squeezes them shut to blink. */
  eyes: Joint;
  arms: readonly [Joint, Joint];
}>;

/** An engineer's desk: the floating screen in front of the robot and the lines of code on it. */
export type ScreenRig = Readonly<{ glass: Placed; lines: readonly Placed[] }>;

/** The props that act: the stamp, the easel's sketch, the magnifier, QA's three lamps, and the rocket with its flame. */
export type PropRigs = Readonly<{
  /** The stamp, its pivot at the rubber's face, resting above the ticket's spot on Product's desk. */
  stamp: Joint;
  /** The easel's canvas: where it stands and faces, and the strokes of the sketch in the order they are drawn. */
  easel: Readonly<{ at: Point3; yaw: number; strokes: readonly Joint[] }>;
  /** The magnifier, its pivot at the lens, hovering over the ticket's spot on QA's desk. */
  magnifier: Joint;
  /** QA's lamps, top to bottom: red, amber, green. */
  lamps: readonly [Joint, Joint, Joint];
  /** The rocket, its pivot at the middle of its foot on the pad, and its flame, its pivot at the nozzle. */
  rocket: Joint;
  flame: Joint;
  /** Where the rocket's smoke billows from. */
  exhaust: Point3;
  screens: readonly ScreenRig[];
}>;

/** Where a ticket sits or hovers at each station. */
export type TicketSpots = Readonly<{
  /** The inbox tray's floor on Product's desk; waiting ideas stack up from here. */
  inbox: Point3;
  product: Point3;
  design: Point3;
  /** Where the ticket waits in front of Engineering, splits and joins again. */
  hub: Point3;
  /** The spot on each engineer's desk. */
  desks: readonly Point3[];
  qa: Point3;
  /** The rocket's hatch, where the ticket boards. */
  rocket: Point3;
}>;

/** A label's name: a department's sign, the call over the button, or the "+N" tag over the inbox. */
export type PinKey = StationId | "button" | "overflow";

/** The island's half-size across (x) and front to back (z), and its corner radius. */
const HALF_X = 4.35;
const HALF_Z = 2.2;
const CORNER = 0.8;
/** The height of every desk's top. */
const DESK = 0.5;
/** A ticket card's size: wide, thick and deep. */
export const CARD = point(0.5, 0.05, 0.36);
/** How many waiting ideas the inbox tray draws before the "+N" tag takes over. */
export const TRAY_SHOWN = 4;

const BUTTON = point(-3.45, 0, 1.25);
const PRODUCT = point(-2.2, 0, -0.45);
/** Product's robot stands at the desk's left end, so its stamp never hides its face. */
const PRODUCT_CLERK = point(-3.18, 0, -0.55);
/** Where on Product's desk the inbox tray sits, from the desk's middle. */
const TRAY = point(0.22, 0, 0.02);
const EASEL = point(-0.72, 0, 0.55);
const DESIGNER = point(-1.5, 0, 0.98);
const ENGINEERING: readonly Point3[] = [point(0.0, 0, -0.95), point(0.92, 0, -0.95), point(1.84, 0, -0.95)];
const HUB = point(0.92, 0, 0.4);
const QA = point(2.4, 0, 0.95);
const LIGHT = point(3.2, 0, 1.2);
const PAD = point(3.35, 0, -1.3);
/** Release's robot stands at the pad's front left, so its sign is clear of the rocket's climb. */
const LAUNCHER = point(2.7, 0, -0.62);
/** The camera's turn round the island, so pieces can face it. */
const TOWARD_CAMERA = 0.6;
/** How high the rocket's pad top stands. */
const PAD_TOP = 0.2;

/** How far a robot stands behind its desk's middle. */
const BEHIND = 0.52;

/**
 * The Orchestra office, read left to right in a three-quarter view: the big orange button and Product's desk
 * with its inbox and stamp, Design's easel, Engineering's three desks with floating screens, QA's desk with
 * its magnifier and traffic light, and Release's launch pad with a tiny rocket. Stepping stones mark the
 * ticket's way between them. One place for every prop's position and size, in island units: y is up from
 * the ground, x runs to the right, z toward the front.
 */
export class OfficeLayout {
  /** Every solid that never moves, in island space. */
  public statics(): readonly Solid[] {
    return [
      ...this.plinth(),
      ...this.rugs(),
      ...this.path(),
      ...this.decor(),
      ...this.desk(PRODUCT, TONE.sunny),
      ...this.inbox(),
      ...ENGINEERING.flatMap((at) => [...this.desk(at, TONE.blue), ...this.keyboard(at)]),
      ...this.desk(QA, TONE.mint),
      ...this.lightPole(),
      ...this.launchPad(),
    ];
  }

  /** The easel's frame and blank canvas, modelled about its foot and turned toward the camera. */
  public easel(): Placed {
    const e = PART.easel;
    const solids: Solid[] = [
      rod(e, TONE.deskSide, point(-0.34, 0, 0.14), point(-0.12, 1.5, 0), 0.04),
      rod(e, TONE.deskSide, point(0.34, 0, 0.14), point(0.12, 1.5, 0), 0.04),
      rod(e, TONE.deskSide, point(0, 0, -0.42), point(0, 1.35, -0.04), 0.035),
      block(e, TONE.deskSide, point(0, 0.62, 0.11), point(0.86, 0.07, 0.12), 0.03),
      block(e, TONE.canvas, point(0, 1.0, 0.06), point(0.84, 0.66, 0.05), 0.04, point(-0.12, 0, 0)),
      // A small pot of paint on the ledge.
      drum(e, TONE.pink, point(0.3, 0.7, 0.13), 0.06, 0.06, 0.09),
    ];
    return { at: EASEL, yaw: TOWARD_CAMERA * 0.6, solids };
  }

  /** The seven robots: one at Product, Design, QA and Release, and three engineers. */
  public robots(): readonly RobotRig[] {
    const behind = (at: Point3): Point3 => offset(at, 0, 0, -BEHIND);
    return [
      this.robot("product", PRODUCT_CLERK, 0.85, TONE.sunny),
      this.robot("design", DESIGNER, 1.0, TONE.pink),
      ...ENGINEERING.map((at) => this.robot("engineering", behind(at), 0, TONE.blue)),
      this.robot("qa", behind(QA), 0, TONE.mint),
      this.robot("release", LAUNCHER, 0.35, TONE.signal),
    ];
  }

  /** The props that act. */
  public props(): PropRigs {
    const p = PART.prop;
    const spots = this.spots();
    const stampFoot = offset(spots.product, 0, 0.26, 0);
    const lens = offset(spots.qa, 0, 0.17, 0);
    const box = offset(LIGHT, 0, 1.46, 0.1);
    const rocketFoot = offset(PAD, 0, PAD_TOP, 0);
    const r = PART.rocket;
    const fins: Solid[] = [0, 1, 2].map((fin) => {
      const angle = (fin / 3) * Math.PI * 2 + 0.6;
      return block(r, TONE.signal, offset(rocketFoot, Math.sin(angle) * 0.27, 0.2, Math.cos(angle) * 0.27), point(0.06, 0.34, 0.26), 0.025, point(0, angle, 0));
    });
    return {
      stamp: {
        pivot: stampFoot,
        solids: [
          block(p, TONE.signal, offset(stampFoot, 0, 0.035, 0), point(0.4, 0.07, 0.3), 0.03),
          block(p, TONE.deskSide, offset(stampFoot, 0, 0.15, 0), point(0.46, 0.16, 0.36), 0.05),
          drum(p, TONE.ink, offset(stampFoot, 0, 0.33, 0), 0.05, 0.07, 0.24),
          ball(p, TONE.signal, offset(stampFoot, 0, 0.5, 0), 0.13, point(1, 0.85, 1)),
        ],
      },
      easel: { at: EASEL, yaw: TOWARD_CAMERA * 0.6, strokes: this.sketch() },
      magnifier: {
        pivot: lens,
        solids: [
          torus(p, TONE.ink, lens, 0.2, 0.045, point(Math.PI / 2, 0, 0)),
          drum(p, TONE.glass, lens, 0.19, 0.19, 0.015),
          rod(p, TONE.deskSide, offset(lens, 0.22, 0.02, -0.04), offset(lens, 0.48, 0.1, -0.12), 0.05),
        ],
      },
      lamps: [this.lamp(box, 0.2), this.lamp(box, 0), this.lamp(box, -0.2)],
      rocket: {
        pivot: rocketFoot,
        solids: [
          drum(r, TONE.ink, offset(rocketFoot, 0, 0.06, 0), 0.13, 0.17, 0.12),
          ball(r, TONE.cream, offset(rocketFoot, 0, 0.5, 0), 0.25, point(1, 1.75, 1)),
          drum(r, TONE.signal, offset(rocketFoot, 0, 0.96, 0), 0.0, 0.16, 0.26),
          torus(r, TONE.signal, offset(rocketFoot, 0, 0.26, 0), 0.215, 0.035, point(Math.PI / 2, 0, 0)),
          torus(r, TONE.ink, offset(rocketFoot, 0, 0.58, 0.225), 0.09, 0.025, point(0, 0, 0)),
          ball(r, TONE.window, offset(rocketFoot, 0, 0.58, 0.215), 0.08, point(1, 1, 0.45)),
          ...fins,
        ],
      },
      flame: {
        pivot: rocketFoot,
        solids: [
          drum(r, TONE.sunny, offset(rocketFoot, 0, -0.2, 0), 0.14, 0.0, 0.4),
          drum(r, TONE.signal, offset(rocketFoot, 0, -0.12, 0), 0.08, 0.0, 0.22),
        ],
      },
      exhaust: offset(PAD, 0, PAD_TOP + 0.05, 0.1),
      screens: ENGINEERING.map((at) => this.screen(at)),
    };
  }

  /** The big button on its pedestal, in front of Product. */
  public button(): ButtonRig {
    return arcadeButton(BUTTON);
  }

  /** Where a ticket sits or hovers at each station. */
  public spots(): TicketSpots {
    const onDesk = (at: Point3, x: number, z: number): Point3 => offset(at, x, DESK + 0.06 + CARD.y / 2, z);
    return {
      inbox: offset(PRODUCT, TRAY.x, DESK + 0.08, TRAY.z),
      product: onDesk(PRODUCT, -0.2, 0.06),
      design: offset(EASEL, 0.62, 1.05, 0.12),
      hub: offset(HUB, 0, 0.8, 0),
      desks: ENGINEERING.map((at) => onDesk(at, 0.2, 0.13)),
      qa: onDesk(QA, 0, 0.06),
      rocket: offset(PAD, 0, PAD_TOP + 0.58, 0.26),
    };
  }

  /** Where each HTML label floats: over each department's robot (Design's over its easel), the button and the inbox. */
  public labels(): ReadonlyMap<PinKey, Point3> {
    const sign = 1.78;
    return new Map<PinKey, Point3>([
      ["product", offset(PRODUCT_CLERK, 0, sign, 0)],
      ["design", offset(EASEL, -0.1, 1.95, 0)],
      ["engineering", offset(ENGINEERING[1], 0, sign, -BEHIND)],
      ["qa", offset(QA, 0, sign, -BEHIND)],
      ["release", offset(LAUNCHER, -0.1, sign - 0.05, 0)],
      ["button", offset(BUTTON, 0, 1.55, 0)],
      ["overflow", offset(PRODUCT, TRAY.x - 0.2, 0.92, TRAY.z + 0.25)],
    ]);
  }

  /** The island's half-size across, for its shadow. */
  public half(): Readonly<{ x: number; z: number }> {
    return { x: HALF_X, z: HALF_Z };
  }

  /** The height of the plinth's underside. */
  public bottom(): number {
    return -0.61;
  }

  /**
   * The points the camera must keep in frame: the plinth's corners top and bottom, the labels with a little
   * room for their own size, the easel's top, and the rocket at the top of its climb.
   */
  public silhouette(climb: number): readonly Point3[] {
    const footprint = [-1, 1].flatMap((x) => [-1, 1].map((z) => point(x * (HALF_X - CORNER * 0.3), 0, z * (HALF_Z - CORNER * 0.3))));
    const labels = [...this.labels().values()].map((at) => offset(at, 0, 0.3, 0));
    const tops = [offset(EASEL, 0, 1.6, 0), offset(PAD, 0, PAD_TOP + 1.0 + climb, 0), offset(LIGHT, 0, 1.8, 0)];
    return [...footprint, ...footprint.map((at) => point(at.x, this.bottom(), at.z)), ...labels, ...tops];
  }

  /** The box every solid and label stays inside, the rocket's climb aside. */
  public extent(): Readonly<{ min: Point3; max: Point3 }> {
    return { min: point(-HALF_X, this.bottom(), -HALF_Z), max: point(HALF_X, 2.3, HALF_Z) };
  }

  /** The cake: a lilac floor, a violet band of soil and a plum bedrock, each a touch narrower than the last. */
  private plinth(): readonly Solid[] {
    const i = PART.island;
    return [
      pad(PART.ground, TONE.ground, point(0, -0.09, 0), point(HALF_X * 2, 0.18, HALF_Z * 2), CORNER),
      pad(i, TONE.soil, point(0, -0.3, 0), point(HALF_X * 2 - 0.08, 0.24, HALF_Z * 2 - 0.08), CORNER - 0.04),
      pad(i, TONE.bedrock, point(0, -0.51, 0), point(HALF_X * 2 - 0.24, 0.2, HALF_Z * 2 - 0.24), CORNER - 0.12),
    ];
  }

  /** A pale rug under each department's corner, so the five read as five places. */
  private rugs(): readonly Solid[] {
    const g = PART.ground;
    return [
      pad(g, TONE.rug, point(-2.45, 0.012, -0.5), point(1.9, 0.025, 1.75), 0.45),
      pad(g, TONE.rug, point(-1.1, 0.012, 0.7), point(1.7, 0.025, 1.45), 0.45),
      pad(g, TONE.rug, point(0.92, 0.012, -1.05), point(3.05, 0.025, 1.5), 0.45),
      pad(g, TONE.rug, point(2.65, 0.012, 0.75), point(1.85, 0.025, 1.6), 0.45),
    ];
  }

  /** Stepping stones along the ticket's way: Product, Design, Engineering, QA, Release. */
  private path(): readonly Solid[] {
    const stops = [point(-2.2, 0, 0.42), point(-1.0, 0, 1.55), point(HUB.x, 0, HUB.z + 0.25), point(1.85, 0, 1.75), point(3.1, 0, -0.2)];
    const stones: Solid[] = [];
    for (let leg = 0; leg < stops.length - 1; leg += 1) {
      const from = stops[leg];
      const to = stops[leg + 1];
      const span = Math.hypot(to.x - from.x, to.z - from.z);
      const count = Math.max(1, Math.round(span / 0.38));
      for (let stone = leg === 0 ? 0 : 1; stone <= count; stone += 1) {
        const at = lerp(from, to, stone / count);
        stones.push(pad(PART.path, TONE.tile, point(at.x, 0.018, at.z), point(0.2, 0.02, 0.16), 0.08));
      }
    }
    return stones;
  }

  /** Potted plants in the corners, and a water cooler by Engineering. */
  private decor(): readonly Solid[] {
    const d = PART.decor;
    const plant = (at: Point3, size: number): Solid[] => [
      drum(d, TONE.pot, offset(at, 0, 0.16 * size, 0), 0.17 * size, 0.13 * size, 0.32 * size),
      ball(d, TONE.leaf, offset(at, 0, 0.5 * size, 0), 0.24 * size),
      ball(d, TONE.leafDark, offset(at, 0.14 * size, 0.42 * size, 0.1 * size), 0.16 * size),
      ball(d, TONE.leaf, offset(at, -0.12 * size, 0.66 * size, -0.05 * size), 0.15 * size),
    ];
    const cooler = point(-0.85, 0, -1.75);
    return [
      ...plant(point(-3.7, 0, -1.55), 1.05),
      ...plant(point(3.85, 0, 1.7), 1),
      ...plant(point(-0.05, 0, 1.72), 0.8),
      ...plant(point(-3.85, 0, 0.1), 0.75),
      block(d, TONE.cream, offset(cooler, 0, 0.32, 0), point(0.34, 0.64, 0.32), 0.08),
      drum(d, TONE.holo, offset(cooler, 0, 0.82, 0), 0.15, 0.15, 0.34),
      drum(d, TONE.blue, offset(cooler, 0, 1.01, 0), 0.08, 0.13, 0.06),
      block(d, TONE.ink, offset(cooler, 0, 0.45, 0.17), point(0.12, 0.08, 0.04), 0.02),
    ];
  }

  /** A desk at `at`: a warm sand top on two panels, with a strip of its department's colour along the front. */
  private desk(at: Point3, accent: Tone): readonly Solid[] {
    const k = PART.desk;
    return [
      block(k, TONE.deskTop, offset(at, 0, DESK - 0.04, 0), point(0.92, 0.09, 0.62), 0.04),
      block(k, TONE.deskSide, offset(at, -0.39, (DESK - 0.08) / 2, 0), point(0.08, DESK - 0.08, 0.54), 0.03),
      block(k, TONE.deskSide, offset(at, 0.39, (DESK - 0.08) / 2, 0), point(0.08, DESK - 0.08, 0.54), 0.03),
      block(k, accent, offset(at, 0, DESK - 0.14, 0.29), point(0.7, 0.07, 0.04), 0.02),
    ];
  }

  /** An engineer's keyboard and mug. */
  private keyboard(at: Point3): readonly Solid[] {
    const k = PART.desk;
    return [
      block(k, TONE.cream, offset(at, -0.12, DESK + 0.02, 0.05), point(0.36, 0.035, 0.13), 0.02),
      drum(k, TONE.pot, offset(at, -0.36, DESK + 0.07, 0.16), 0.05, 0.05, 0.12),
    ];
  }

  /** Product's inbox tray, at the desk's left end, where dropped ideas wait. */
  private inbox(): readonly Solid[] {
    const k = PART.desk;
    const at = offset(PRODUCT, TRAY.x, DESK + 0.02, TRAY.z);
    return [
      block(k, TONE.cream, at, point(0.5, 0.04, 0.42), 0.02),
      block(k, TONE.cream, offset(at, 0, 0.05, -0.2), point(0.5, 0.1, 0.04), 0.015),
      block(k, TONE.cream, offset(at, -0.24, 0.05, 0), point(0.04, 0.1, 0.42), 0.015),
      block(k, TONE.cream, offset(at, 0.24, 0.05, 0), point(0.04, 0.1, 0.42), 0.015),
    ];
  }

  /** QA's traffic light on its pole, beside the desk. */
  private lightPole(): readonly Solid[] {
    const l = PART.lamp;
    const box = offset(LIGHT, 0, 1.46, 0.1);
    return [
      drum(l, TONE.ink, offset(LIGHT, 0, 0.04, 0.1), 0.18, 0.2, 0.08),
      rod(l, TONE.ink, offset(LIGHT, 0, 0.05, 0.1), offset(LIGHT, 0, 1.2, 0.1), 0.04),
      block(l, TONE.ink, box, point(0.28, 0.66, 0.22), 0.07),
      block(l, TONE.mint, offset(box, 0, 0.37, 0), point(0.34, 0.06, 0.26), 0.03),
    ];
  }

  /** One of QA's lamps, `y` above the middle of the light's box. */
  private lamp(box: Point3, y: number): Joint {
    const at = offset(box, 0, y, 0.13);
    return { pivot: at, solids: [ball(PART.lamp, TONE.lamp, at, 0.085)] };
  }

  /** Release's launch pad: an ink base and a cream deck ringed in orange. */
  private launchPad(): readonly Solid[] {
    const r = PART.rocket;
    return [
      drum(r, TONE.ink, offset(PAD, 0, 0.07, 0), 0.56, 0.6, 0.14),
      drum(r, TONE.cream, offset(PAD, 0, 0.17, 0), 0.5, 0.52, 0.06),
      torus(r, TONE.signal, offset(PAD, 0, PAD_TOP, 0), 0.38, 0.03, point(Math.PI / 2, 0, 0)),
      // A stubby gantry beside the rocket.
      rod(r, TONE.ink, offset(PAD, 0.44, 0.2, -0.26), offset(PAD, 0.44, 1.0, -0.26), 0.035),
      block(r, TONE.sunny, offset(PAD, 0.44, 1.02, -0.26), point(0.12, 0.08, 0.12), 0.03),
      rod(r, TONE.ink, offset(PAD, 0.44, 0.78, -0.26), offset(PAD, 0.24, 0.78, -0.12), 0.025),
    ];
  }

  /** An engineer's floating screen and its lines of code, modelled in the desk's space. */
  private screen(at: Point3): ScreenRig {
    const s = PART.screen;
    // Low and tipped back like a laptop's lid, so it sits under the robot's face rather than over it.
    const middle = offset(at, 0.0, DESK + 0.15, 0.0);
    const tilt = point(-0.55, 0, 0);
    // A point (y up the screen, z out of it) on the tipped screen: turned about x by the same -0.55.
    const lean = (y: number, z: number): Point3 => point(0, y * Math.cos(0.55) + z * Math.sin(0.55), -y * Math.sin(0.55) + z * Math.cos(0.55));
    const glass: Placed = {
      at: middle,
      yaw: 0,
      solids: [block(s, TONE.holo, point(0, 0, 0), point(0.5, 0.24, 0.02), 0.04, tilt), rod(s, TONE.ink, point(0, -0.14, -0.02), point(0, -0.1, 0), 0.02)],
    };
    const widths = [0.3, 0.18, 0.36, 0.24];
    const lines = widths.map((width, row): Placed => {
      const face = lean(0.07 - row * 0.048, 0.022);
      return {
        at: middle,
        yaw: 0,
        solids: [block(s, row === 2 ? TONE.eye : TONE.code, point(-0.17 + width / 2 + (row % 2) * 0.05, face.y, face.z), point(width, 0.026, 0.01), 0.011, tilt)],
      };
    });
    return { glass, lines };
  }

  /** The sketch Design draws, stroke by stroke, on the canvas's face in the easel's space. */
  private sketch(): readonly Joint[] {
    const e = PART.easel;
    const tilt = point(-0.12, 0, 0);
    // The canvas's face, leaning back a little: a stroke at (x, y) on it sits here.
    const face = (x: number, y: number): Point3 => point(x, 1.0 + y * Math.cos(0.12), 0.095 - y * Math.sin(0.12));
    const stroke = (tone: Tone, x: number, y: number, width: number, height: number): Joint => ({
      pivot: face(x, y),
      solids: [block(e, tone, face(x, y), point(width, height, 0.02), Math.min(width, height) * 0.4, tilt)],
    });
    return [
      stroke(TONE.ink, 0, 0.22, 0.66, 0.05),
      { pivot: face(-0.24, 0.07), solids: [ball(e, TONE.pink, face(-0.24, 0.07), 0.07, point(1, 1, 0.3))] },
      stroke(TONE.ink, 0.06, 0.1, 0.32, 0.035),
      stroke(TONE.ink, 0.02, 0.03, 0.24, 0.035),
      stroke(TONE.blue, 0, -0.1, 0.62, 0.09),
      stroke(TONE.signal, 0.16, -0.23, 0.26, 0.07),
    ];
  }

  /** A robot standing at `at` facing `yaw`, with its department's colour on its belly. */
  private robot(station: StationId, at: Point3, yaw: number, accent: Tone): RobotRig {
    const r = PART.robot;
    const body: Solid[] = [
      drum(r, TONE.ink, point(0, 0.05, 0), 0.17, 0.2, 0.1),
      block(r, TONE.cream, point(0, 0.34, 0), point(0.48, 0.44, 0.38), 0.15),
      block(r, accent, point(0, 0.33, 0.19), point(0.26, 0.15, 0.04), 0.03),
      drum(r, TONE.ink, point(0, 0.59, 0), 0.07, 0.08, 0.07),
    ];
    const neck = point(0, 0.6, 0);
    const head: Joint = {
      pivot: neck,
      solids: [
        block(r, TONE.cream, point(0, 0.81, 0), point(0.58, 0.42, 0.42), 0.15),
        block(r, TONE.screen, point(0, 0.81, 0.2), point(0.45, 0.28, 0.04), 0.08),
        drum(r, TONE.ink, point(-0.3, 0.81, 0), 0.07, 0.07, 0.06, point(0, 0, Math.PI / 2)),
        drum(r, TONE.ink, point(0.3, 0.81, 0), 0.07, 0.07, 0.06, point(0, 0, Math.PI / 2)),
        rod(r, TONE.ink, point(0, 1.0, 0), point(0, 1.16, 0), 0.022),
        ball(r, TONE.signal, point(0, 1.2, 0), 0.065),
      ],
    };
    const face = point(0, 0.83, 0.225);
    const eyes: Joint = {
      pivot: face,
      solids: [
        ball(r, TONE.eye, offset(face, -0.1, 0, 0), 0.05, point(1, 1.3, 0.5)),
        ball(r, TONE.eye, offset(face, 0.1, 0, 0), 0.05, point(1, 1.3, 0.5)),
        block(r, TONE.eye, offset(face, 0, -0.085, 0), point(0.08, 0.02, 0.02), 0.01),
      ],
    };
    const arm = (side: number): Joint => {
      const shoulder = point(side * 0.27, 0.46, 0);
      return {
        pivot: shoulder,
        solids: [rod(r, TONE.cream, shoulder, offset(shoulder, side * 0.05, -0.2, 0.04), 0.055), ball(r, TONE.ink, offset(shoulder, side * 0.06, -0.25, 0.05), 0.07)],
      };
    };
    return { station, at, yaw, body, head, eyes, arms: [arm(-1), arm(1)] };
  }
}
