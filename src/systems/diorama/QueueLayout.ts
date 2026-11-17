import { point, type Extent, type Point3, type Solid, type Tone } from "./kit";
import { PART, TONE } from "./palette";
import { arc, ball, block, drum, lerp, offset, pad, rod, torus } from "./shapes";

/** A group of solids that moves as one, about its pivot. The solids are placed in island space. */
export type Piece = Readonly<{ pivot: Point3; solids: readonly Solid[] }>;

/** One service machine: what moves with it, and where its lamp, fuse, tray, chimney and labels are. */
export type MachineRig = Readonly<{
  /** The machine's body and everything fixed to it; its pivot is the middle of its foot. */
  body: Piece;
  /** The status lamp's dome, tinted by status. */
  lamp: Piece;
  /** The fuse bar at full length; its pivot is the bar's left end, so it fills from there. */
  fuse: Piece;
  /** Where each message the machine holds sits on its tray, the first one first. */
  tray: readonly Point3[];
  /** Where its smoke comes out. */
  chimney: Point3;
  /** Where its name sign floats, and the middle of its screen. */
  sign: Point3;
  screen: Point3;
}>;

/** The broker's hopper: where its columns stand, how high each level sits, and where parcels drop in. */
export type HopperPlan = Readonly<{
  /** Each column's middle on the hopper floor, as x and z; columns 0–2 are the back row, 3–5 the front. */
  columns: readonly Point3[];
  /** The height of a parcel's middle on the floor, and how much higher each level up is. */
  floor: number;
  pitch: number;
  levels: number;
  /** The columns from the first to fill to the last: the front middle first, so the pile shows from the start. */
  fillOrder: readonly number[];
}>;

/** The ends of the tracks the parcels travel. */
export type TrackAnchors = Readonly<{
  /** Where a parcel comes out of the kiosk onto the belt, and the top of the belt. */
  outlet: Point3;
  beltEnd: Point3;
  /** The hopper's mouth, where parcels drop in, and its spout, where they leave for a service. */
  mouth: Point3;
  spout: Point3;
  /** Each service's tray. */
  trays: readonly Point3[];
}>;

/** Where the HTML labels float. */
export type LabelAnchors = Readonly<{ kiosk: Point3; button: Point3; broker: Point3; overflow: Point3 }>;

/** The big button: its fixed housing, its cap (pivot at the cap's foot), how far it goes in, and its hit box. */
export type ButtonRig = Readonly<{ housing: readonly Solid[]; cap: Piece; travel: number; hit: Extent }>;

/** A parcel's edge, in island units. */
const PARCEL = 0.26;
/** The island's half-size across (x) and front to back (z), and its corner radius. */
const HALF_X = 4.15;
const HALF_Z = 2.35;
const CORNER = 0.75;

const KIOSK = point(-2.75, 0, -0.9);
const BUTTON = point(-2.45, 0, 1.25);
const HOPPER = point(0.05, 0, -0.45);
const MACHINES: readonly Point3[] = [point(1.85, 0, 1.3), point(2.65, 0, -0.05), point(3.4, 0, -1.4)];
/** Each machine's own colour on its side panel and chimney, so the three read as three. */
const ACCENTS: readonly Tone[] = [TONE.sunny, TONE.pink, TONE.window];

/** The belt's centre line, from the kiosk's hatch up to beside the hopper. */
const BELT_START = point(KIOSK.x + 0.68, 0.92, KIOSK.z + 0.3);
const BELT_END = point(HOPPER.x - 0.8, 1.42, HOPPER.z - 0.15);

/** How high a dealt message is thrown above the higher end of its path. */
export const DISPATCH_HOP = 0.75;
/** How high a message handed back by a fallen machine is thrown, higher than a dealt one so the two paths part. */
export const RETURN_HOP = 0.5;

/** The hopper's glass: its half-size across and front to back, and its floor and rim heights. */
const TANK = { halfX: 0.6, halfZ: 0.43, floor: 0.64, rim: 2.44 } as const;

/**
 * The queue island, read left to right in a three-quarter view: the Checkout kiosk with the big orange
 * button on a pedestal in front of it, a belt that carries messages up and tosses them into the NATS
 * broker's glass hopper, and three service machines on a diagonal, each with a tray, a status lamp, a
 * screen, a fuse and a chimney. One place for every prop's position and size, in island units: y is up
 * from the ground, x runs to the right, z toward the front.
 */
export class QueueLayout {
  /** Every solid that never moves, in island space. */
  public statics(): readonly Solid[] {
    return [...this.plinth(), ...this.decor(), ...this.belt(), ...this.broker(), ...this.dispatchBeads()];
  }

  /** The kiosk, which gives a little pulse when the button sends. */
  public kiosk(): Piece {
    const at = KIOSK;
    const k = PART.kiosk;
    const solids: Solid[] = [
      block(k, TONE.ink, offset(at, 0, 0.04, 0), point(1.42, 0.08, 1.22), 0.03),
      block(k, TONE.cream, offset(at, 0, 0.62, 0), point(1.3, 1.1, 1.1), 0.1),
      block(k, TONE.ink, offset(at, 0, 1.24, 0), point(1.5, 0.16, 1.3), 0.06),
      block(k, TONE.sunny, offset(at, 0, 1.4, 0), point(1.2, 0.16, 1.0), 0.06),
      // The window with a little counter under it, and the door.
      block(k, TONE.ink, offset(at, -0.24, 0.66, 0.55), point(0.6, 0.44, 0.04), 0.03),
      block(k, TONE.window, offset(at, -0.24, 0.66, 0.575), point(0.5, 0.34, 0.03), 0.02),
      block(k, TONE.creamShade, offset(at, -0.24, 0.42, 0.62), point(0.64, 0.06, 0.16), 0.02),
      block(k, TONE.ink, offset(at, 0.36, 0.36, 0.56), point(0.32, 0.62, 0.04), 0.03),
      ball(k, TONE.sunny, offset(at, 0.46, 0.38, 0.6), 0.03),
      // The hatch on its right side, where messages come out onto the belt.
      block(k, TONE.ink, offset(at, 0.66, 0.92, 0.3), point(0.05, 0.3, 0.38), 0.02),
    ];
    // A striped awning over the front.
    for (let stripe = 0; stripe < 5; stripe += 1) {
      const tone = stripe % 2 === 0 ? TONE.signal : TONE.cream;
      solids.push(block(k, tone, offset(at, -0.52 + stripe * 0.26, 1.0, 0.7), point(0.26, 0.06, 0.48), 0.025, point(0.42, 0, 0)));
    }
    return { pivot: at, solids };
  }

  /** The big arcade button on its pedestal. */
  public button(): ButtonRig {
    const at = BUTTON;
    const b = PART.button;
    const housing: Solid[] = [
      drum(b, TONE.ink, offset(at, 0, 0.05, 0), 0.7, 0.74, 0.1),
      drum(b, TONE.ink, offset(at, 0, 0.32, 0), 0.5, 0.6, 0.48),
      drum(b, TONE.cream, offset(at, 0, 0.62, 0), 0.74, 0.76, 0.16),
      drum(b, TONE.creamShade, offset(at, 0, 0.71, 0), 0.62, 0.66, 0.04),
    ];
    const foot = offset(at, 0, 0.69, 0);
    const cap: Piece = {
      pivot: foot,
      solids: [drum(b, TONE.signal, offset(foot, 0, 0.1, 0), 0.56, 0.56, 0.2), ball(b, TONE.signal, offset(foot, 0, 0.19, 0), 0.56, point(1, 0.4, 1))],
    };
    return {
      housing,
      cap,
      travel: 0.17,
      hit: { min: offset(at, -0.8, 0, -0.8), max: offset(at, 0.8, 1.2, 0.8) },
    };
  }

  /** The hopper's glass, drawn see-through. */
  public glass(): Solid {
    const height = TANK.rim - TANK.floor;
    return block(PART.broker, TONE.glass, offset(HOPPER, 0, TANK.floor + height / 2, 0), point(TANK.halfX * 2, height, TANK.halfZ * 2), 0.05);
  }

  /** How the waiting parcels stack in the hopper. */
  public hopper(): HopperPlan {
    const pitch = PARCEL + 0.08;
    const columns: Point3[] = [];
    for (const z of [-0.17, 0.17]) {
      for (const x of [-pitch, 0, pitch]) {
        columns.push(offset(HOPPER, x, 0, z));
      }
    }
    return { columns, floor: TANK.floor + PARCEL / 2 + 0.01, pitch: PARCEL + 0.02, levels: 6, fillOrder: [4, 3, 5, 1, 0, 2] };
  }

  /** The three service machines, Orders at the front left to Inventory at the back right. */
  public machines(): readonly MachineRig[] {
    return MACHINES.map((at, index) => this.machine(at, ACCENTS[index % ACCENTS.length]));
  }

  /** The ends of every track. */
  public tracks(): TrackAnchors {
    return {
      outlet: offset(BELT_START, 0.07, PARCEL / 2 + 0.06, 0),
      beltEnd: offset(BELT_END, -0.02, PARCEL / 2 + 0.06, 0),
      mouth: offset(HOPPER, 0, TANK.rim + 0.12, 0),
      spout: offset(HOPPER, 0.92, 0.84, 0),
      trays: this.machines().map((machine) => machine.tray[1]),
    };
  }

  /** Where the HTML labels float. */
  public labels(): LabelAnchors {
    return {
      kiosk: offset(KIOSK, 0, 1.78, 0),
      button: offset(BUTTON, 0, 1.55, 0),
      broker: offset(HOPPER, -0.22, 0.3, 0.56),
      overflow: offset(HOPPER, 0, TANK.rim + 0.5, 0),
    };
  }

  /** How steeply the belt climbs, in radians. */
  public beltSlope(): number {
    return Math.atan2(BELT_END.y - BELT_START.y, BELT_END.x - BELT_START.x);
  }

  /** A parcel's edge. */
  public parcel(): number {
    return PARCEL;
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
   * The points the camera must keep in frame: the plinth's corners top and bottom, and the tops of what
   * stands on it, labels included, with a little room for the labels' own size.
   */
  public silhouette(): readonly Point3[] {
    const footprint = [-1, 1].flatMap((x) => [-1, 1].map((z) => point(x * (HALF_X - CORNER * 0.3), 0, z * (HALF_Z - CORNER * 0.3))));
    const labels = this.labels();
    const tops = [
      offset(labels.kiosk, 0, 0.3, 0),
      offset(labels.button, 0, 0.35, 0),
      offset(labels.overflow, 0, 0.3, 0),
      ...this.machines().map((machine) => offset(machine.sign, 0, 0.3, 0)),
      offset(HOPPER, -TANK.halfX, TANK.rim + 0.15, -TANK.halfZ),
      offset(HOPPER, TANK.halfX, TANK.rim + 0.15, -TANK.halfZ),
    ];
    return [...footprint, ...footprint.map((at) => point(at.x, this.bottom(), at.z)), ...tops];
  }

  /** The box every solid and label fits in. */
  public extent(): Extent {
    return { min: point(-HALF_X, this.bottom(), -HALF_Z), max: point(HALF_X, TANK.rim + 0.75, HALF_Z) };
  }

  /** The cake: a mint ground, a teal band of soil and a deep teal bedrock, each a touch narrower than the last. */
  private plinth(): readonly Solid[] {
    const i = PART.island;
    return [
      pad(PART.ground, TONE.ground, point(0, -0.09, 0), point(HALF_X * 2, 0.18, HALF_Z * 2), CORNER),
      pad(i, TONE.soil, point(0, -0.3, 0), point(HALF_X * 2 - 0.08, 0.24, HALF_Z * 2 - 0.08), CORNER - 0.04),
      pad(i, TONE.bedrock, point(0, -0.51, 0), point(HALF_X * 2 - 0.24, 0.2, HALF_Z * 2 - 0.24), CORNER - 0.12),
    ];
  }

  /** Paving under the kiosk and the machines, a few bushes and stepping stones. */
  private decor(): readonly Solid[] {
    const g = PART.ground;
    const d = PART.decor;
    const stones: Solid[] = [0, 1, 2].map((step) =>
      pad(g, TONE.paving, point(-1.6 + step * 0.42, 0.02, 1.55 - step * 0.12), point(0.3, 0.04, 0.26), 0.12),
    );
    return [
      pad(g, TONE.paving, point(-2.65, 0.015, -0.2), point(2.0, 0.03, 3.4), 0.5),
      pad(g, TONE.paving, point(2.62, 0.015, -0.05), point(2.5, 0.03, 3.9), 0.5),
      ...stones,
      ball(d, TONE.bush, point(-3.62, 0.3, -1.85), 0.34),
      ball(d, TONE.bushDark, point(-3.3, 0.2, -1.6), 0.22),
      ball(d, TONE.bush, point(3.72, 0.26, 1.75), 0.3),
      ball(d, TONE.bushDark, point(3.45, 0.17, 1.95), 0.19),
      ball(d, TONE.bush, point(-0.75, 0.22, 1.85), 0.25),
      ball(d, TONE.bushDark, point(-0.5, 0.14, 1.98), 0.15),
      ball(d, TONE.pink, point(-0.68, 0.46, 1.8), 0.06),
      ball(d, TONE.sunny, point(3.6, 0.52, 1.7), 0.06),
      ball(d, TONE.bushDark, point(0.9, 0.18, -1.95), 0.2),
      ball(d, TONE.bush, point(1.15, 0.24, -1.85), 0.26),
    ];
  }

  /** The belt from the kiosk's hatch up to the hopper: a dark belt between cream rails, on rollers and legs. */
  private belt(): readonly Solid[] {
    const b = PART.belt;
    const start = BELT_START;
    const end = BELT_END;
    const run = Math.hypot(end.x - start.x, end.y - start.y);
    const slope = this.beltSlope();
    const middle = lerp(start, end, 0.5);
    const along = point(0, 0, slope);
    const solids: Solid[] = [
      block(b, TONE.belt, middle, point(run, 0.1, 0.44), 0.04, along),
      block(b, TONE.cream, offset(middle, 0, 0.06, 0.25), point(run + 0.06, 0.12, 0.06), 0.03, along),
      block(b, TONE.cream, offset(middle, 0, 0.06, -0.25), point(run + 0.06, 0.12, 0.06), 0.03, along),
      drum(b, TONE.ink, start, 0.075, 0.075, 0.5, point(Math.PI / 2, 0, 0)),
      drum(b, TONE.ink, end, 0.075, 0.075, 0.5, point(Math.PI / 2, 0, 0)),
    ];
    for (const share of [0.15, 0.85]) {
      const top = lerp(start, end, share);
      solids.push(rod(b, TONE.ink, point(top.x, 0, top.z + 0.18), offset(top, 0, -0.05, 0.18), 0.04));
      solids.push(rod(b, TONE.ink, point(top.x, 0, top.z - 0.18), offset(top, 0, -0.05, -0.18), 0.04));
    }
    return solids;
  }

  /** The broker: a cream cabinet, the glass hopper's ink frame, its orange mouth and its spout. */
  private broker(): readonly Solid[] {
    const k = PART.broker;
    const at = HOPPER;
    const { halfX, halfZ, floor, rim } = TANK;
    const solids: Solid[] = [
      block(k, TONE.ink, offset(at, 0, 0.04, 0), point(1.5, 0.08, 1.16), 0.03),
      block(k, TONE.cream, offset(at, 0, 0.34, 0), point(1.4, 0.56, 1.06), 0.1),
      block(k, TONE.ink, offset(at, 0, floor - 0.02, 0), point(halfX * 2 + 0.16, 0.06, halfZ * 2 + 0.16), 0.03),
      torus(k, TONE.signal, offset(at, 0, rim + 0.06, 0), 0.36, 0.07, point(Math.PI / 2, 0, 0)),
      drum(k, TONE.ink, offset(at, halfX + 0.14, 0.84, 0), 0.13, 0.13, 0.3, point(0, 0, Math.PI / 2)),
      drum(k, TONE.signal, offset(at, halfX + 0.3, 0.84, 0), 0.15, 0.15, 0.06, point(0, 0, Math.PI / 2)),
    ];
    for (const [x, z] of [
      [-halfX, -halfZ],
      [halfX, -halfZ],
      [-halfX, halfZ],
      [halfX, halfZ],
    ] as const) {
      solids.push(rod(k, TONE.ink, offset(at, x, floor, z), offset(at, x, rim, z), 0.045));
    }
    for (const z of [-halfZ, halfZ]) {
      solids.push(rod(k, TONE.ink, offset(at, -halfX, rim, z), offset(at, halfX, rim, z), 0.045));
    }
    for (const x of [-halfX, halfX]) {
      solids.push(rod(k, TONE.ink, offset(at, x, rim, -halfZ), offset(at, x, rim, halfZ), 0.045));
    }
    return solids;
  }

  /** Dotted arcs from the spout to each machine's tray: the paths the messages are thrown along. */
  private dispatchBeads(): readonly Solid[] {
    const { spout, trays } = this.tracks();
    const beads: Solid[] = [];
    for (const tray of trays) {
      for (let bead = 1; bead < 12; bead += 1) {
        beads.push(ball(PART.track, TONE.bead, arc(spout, tray, DISPATCH_HOP, bead / 12), 0.026));
      }
    }
    return beads;
  }

  /** One machine standing at `at`, with its side panel and chimney rim in its own `accent`. */
  private machine(at: Point3, accent: Tone): MachineRig {
    const m = PART.machine;
    const front = 0.48;
    const body: Solid[] = [
      block(m, TONE.ink, offset(at, 0, 0.04, 0), point(1.18, 0.08, 1.04), 0.03),
      block(m, TONE.cream, offset(at, 0, 0.58, 0), point(1.1, 1.0, 0.96), 0.12),
      block(m, TONE.ink, offset(at, 0, 1.12, 0), point(1.14, 0.1, 1.0), 0.04),
      block(m, TONE.creamShade, offset(at, 0, 1.19, 0.03), point(0.98, 0.05, 0.74), 0.02),
      // The screen in its ink bezel, and the fuse slot under it.
      block(m, TONE.ink, offset(at, 0, 0.7, front), point(0.74, 0.44, 0.06), 0.04),
      block(m, TONE.screen, offset(at, 0, 0.7, front + 0.03), point(0.62, 0.32, 0.02), 0.02),
      block(m, TONE.ink, offset(at, 0, 0.32, front), point(0.74, 0.12, 0.05), 0.03),
      // A coloured panel down its right side, with vents.
      block(m, accent, offset(at, 0.55, 0.62, 0), point(0.05, 0.7, 0.74), 0.03),
      block(m, TONE.ink, offset(at, 0.58, 0.78, 0), point(0.03, 0.045, 0.52), 0.015),
      block(m, TONE.ink, offset(at, 0.58, 0.64, 0), point(0.03, 0.045, 0.52), 0.015),
      block(m, TONE.ink, offset(at, 0.58, 0.5, 0), point(0.03, 0.045, 0.52), 0.015),
      // The chimney at the back left, and the lamp's stem at the back right.
      drum(m, TONE.ink, offset(at, -0.38, 1.33, -0.34), 0.08, 0.08, 0.32),
      drum(m, accent, offset(at, -0.38, 1.5, -0.34), 0.11, 0.11, 0.06),
      rod(m, TONE.ink, offset(at, 0.38, 1.15, -0.34), offset(at, 0.38, 1.36, -0.34), 0.045),
      drum(m, TONE.ink, offset(at, 0.38, 1.4, -0.34), 0.14, 0.15, 0.06),
    ];
    const fuseFoot = offset(at, -0.31, 0.32, front + 0.03);
    const trayTop = 1.22 + PARCEL / 2;
    const tray = [
      offset(at, -0.29, trayTop, 0.2),
      offset(at, 0, trayTop, 0.2),
      offset(at, 0.29, trayTop, 0.2),
      offset(at, -0.145, trayTop, -0.1),
      offset(at, 0.145, trayTop, -0.1),
    ];
    return {
      body: { pivot: at, solids: body },
      lamp: { pivot: at, solids: [ball(m, TONE.lamp, offset(at, 0.38, 1.49, -0.34), 0.15, point(1, 0.9, 1))] },
      fuse: { pivot: fuseFoot, solids: [block(m, TONE.signal, offset(fuseFoot, 0.31, 0, 0), point(0.62, 0.06, 0.03), 0.015)] },
      tray,
      chimney: offset(at, -0.38, 1.62, -0.34),
      sign: offset(at, 0, 1.92, 0),
      screen: offset(at, 0, 0.7, front + 0.05),
    };
  }
}
