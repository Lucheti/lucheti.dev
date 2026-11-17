import { grownExtent, solidExtent, unionExtent, type Part, type Solid, type Tone, type Turn } from "./Solid";
import { STAR_COUNT, targetKey, type Target } from "./Target";
import { along, length, minus, point, unit, type Extent, type Point3 } from "./space";

/** The pieces that move on their own or when clicked; everything else is merged into one static model. */
export type StarPiece = `star-${1 | 2 | 3 | 4 | 5}`;
export type SteamPiece = `steam-${1 | 2 | 3}`;
export type PieceId =
  | "toggle-track"
  | "toggle-knob"
  | "button-base"
  | "button-cap"
  | "slider-track"
  | "slider-knob"
  | StarPiece
  | "checkbox-box"
  | "checkbox-tick"
  | "lamp-stand"
  | "lamp-head"
  | "duck"
  | "plant-pot"
  | "plant-leaves"
  | SteamPiece
  | "cloud";

/**
 * A piece: its solids (in island space), the point it turns and scales about, what clicking it does, the
 * way it lifts while hovered, and whether it gets its own paint so it can change colour.
 */
export type Piece = Readonly<{
  id: PieceId;
  pivot: Point3;
  solids: readonly Solid[];
  target: Target | null;
  lift: Point3;
  tinted: boolean;
}>;

/** A box the pointer can hit to reach a target: a little larger than the target's pieces, so small things are easy to click. */
export type HitBox = Readonly<{ target: Target; extent: Extent }>;

/** Where the live screen sits: its centre, size in island units, and the CSS size its interface is laid out at. */
export type ScreenAnchor = Readonly<{ centre: Point3; width: number; height: number; pixels: Readonly<{ width: number; height: number }> }>;

/** The floating UI card: where it hangs, how big it is, and how it is turned toward the viewer. */
export type CardPlacement = Readonly<{
  at: Point3;
  /** Island units per card unit; the card blueprint is 2.5 × 3.5 units. */
  scale: number;
  /** Tips the card's face up toward the viewer, in radians. */
  tilt: number;
  /** Then turns it about the vertical, in radians. */
  yaw: number;
  /** How far from its centre the card reaches at its widest, layers open, in island units. */
  reach: number;
}>;

/** The desk lamp: its bulb, the spot on the desk it lights, and how wide that pool is. */
export type LampAnchor = Readonly<{ bulb: Point3; aim: Point3; pool: number }>;

/** The island's square footprint reaches this far from the centre on x and z. */
const HALF = 1.9;
const PLANKS = 7;
const PLANK_GAP = 0.014;
const PLANK = 0.13;
const EARTH = 0.3;
const BEDROCK = 0.12;
const WALL = 0.22;
const WALL_HEIGHT = 2.5;
/** The inner faces of the back and left walls (the same number, as the corner is square). */
const INNER = -HALF + WALL;

const DESK_TOP = 0.92;
const DESK = { left: -0.4, right: 1.82, back: -1.66, front: -0.78, slab: 0.14 } as const;

const SCREEN = { x: 0.62, y: 1.56, face: -1.345, width: 1.5, height: 0.94 } as const;
const SCREEN_PIXELS = { width: 156, height: 98 } as const;

/** The pegboard's front face, on the back wall, and its controls' rows. */
const BOARD_FACE = INNER + 0.06;
const ROWS = { top: 2.06, slider: 1.72, stars: 1.38, check: 1.06 } as const;
const TOGGLE = { x: -1.3, travel: 0.12 } as const;
const BUTTON = { x: -0.76, depth: 0.05 } as const;
const SLIDER = { x: -1.03, stops: [-0.33, 0, 0.33] } as const;
const CHECKBOX_X = -1.38;

const LAMP_FOOT = point(1.62, DESK_TOP + 0.025, -1.55);
const LAMP_ELBOW = point(1.72, 1.6, -1.58);
const LAMP_HEAD = point(1.72, 1.92, -1.22);
const LAMP_AIM = point(1.42, DESK_TOP, -0.98);

const MUG = point(1.42, DESK_TOP, -0.98);
const DUCK = point(-0.2, DESK_TOP, -0.98);
/** The duck looks out toward the viewer's side of the room. */
const DUCK_FACING = 0.75;

const PLANT = point(-1.12, 0, 1.2);
const POT_HEIGHT = 0.48;

const WINDOW = { z: -0.62, y: 1.6, width: 1.22, height: 1.0 } as const;

/** Lifts while hovered: off the wall for wall controls, up for things standing on something. */
const OFF_WALL = point(0, 0, 0.04);
const UPWARD = point(0, 0.05, 0);
const STILL = point(0, 0, 0);
/** How much larger than its pieces a hit box is. */
const HIT_MARGIN = 0.015;

/** Euler angles that turn a shape's +y axis to point along `direction` (x first, then z, with no y turn). */
export function pointing(direction: Point3): Turn {
  const d = unit(direction);
  const side = Math.sqrt(Math.max(0, 1 - d.x * d.x));
  return point(side === 0 ? 0 : Math.atan2(d.z, d.y), 0, Math.asin(-d.x));
}

/** Turns a drum's axis (y) to point out of the back wall (+z). */
const OUT_OF_BACK_WALL: Turn = point(Math.PI / 2, 0, 0);
/** Turns a drum's axis (y) to point out of the left wall (+x). */
const OUT_OF_LEFT_WALL: Turn = point(0, 0, Math.PI / 2);

/**
 * Every prop on the diorama island, its size and place, in one table. Owns the rules that the island is a
 * cut-away corner (a layered plinth and two walls, open to the viewer), that desk props rest on the desk top,
 * that the pegboard's controls stand on the board, and that the live screen lies on the monitor's face.
 * Pure data, built once.
 */
export class DioramaLayout {
  private readonly still: readonly Solid[];
  private readonly moving: readonly Piece[];
  private readonly bounds: Extent;

  public constructor() {
    this.still = [
      ...DioramaLayout.plinth(),
      ...DioramaLayout.walls(),
      ...DioramaLayout.rug(),
      ...DioramaLayout.pouf(),
      ...DioramaLayout.desk(),
      ...DioramaLayout.monitor(),
      ...DioramaLayout.keyboard(),
      ...DioramaLayout.mug(),
      ...DioramaLayout.board(),
      ...DioramaLayout.window(),
      ...DioramaLayout.shelf(),
      ...DioramaLayout.print(),
    ];
    this.moving = [
      ...DioramaLayout.controls(),
      ...DioramaLayout.lampPieces(),
      DioramaLayout.duck(),
      ...DioramaLayout.plant(),
      ...DioramaLayout.steam(),
      DioramaLayout.cloud(),
    ];
    const card = this.card();
    const cardBox = { min: minus(card.at, point(card.reach, card.reach, card.reach)), max: along(card.at, point(1, 1, 1), card.reach) };
    this.bounds = unionExtent([...this.solids().map(solidExtent), cardBox]);
  }

  /** The solids that never move, in no particular order. */
  public statics(): readonly Solid[] {
    return this.still;
  }

  /** The pieces that move. */
  public pieces(): readonly Piece[] {
    return this.moving;
  }

  /** One piece. */
  public piece(id: PieceId): Piece {
    const found = this.moving.find((piece) => piece.id === id);
    if (found === undefined) {
      throw new Error(`No piece ${id}`);
    }
    return found;
  }

  /** Every solid, still and moving. */
  public solids(): readonly Solid[] {
    return [...this.still, ...this.moving.flatMap((piece) => piece.solids)];
  }

  /** The solids of one prop. */
  public part(part: Part): readonly Solid[] {
    return this.solids().filter((solid) => solid.part === part);
  }

  /** The box the whole island fits in, the floating card's widest reach included. */
  public extent(): Extent {
    return this.bounds;
  }

  /** How far the island's footprint reaches from its centre on x and z. */
  public half(): number {
    return HALF;
  }

  /** The height of the plinth's underside. */
  public bottom(): number {
    return -(PLANK + EARTH + BEDROCK);
  }

  /** The height of the desk top. */
  public deskTop(): number {
    return DESK_TOP;
  }

  /** One hit box per target, round the pieces that answer to it. The floating card's is its own. */
  public hits(): readonly HitBox[] {
    const byTarget = new Map<string, { target: Target; extents: Extent[] }>();
    for (const piece of this.moving) {
      if (piece.target === null) {
        continue;
      }
      const key = targetKey(piece.target);
      const entry = byTarget.get(key) ?? { target: piece.target, extents: [] };
      entry.extents.push(...piece.solids.map(solidExtent));
      byTarget.set(key, entry);
    }
    return [...byTarget.values()].map(({ target, extents }) => ({ target, extent: grownExtent(unionExtent(extents), HIT_MARGIN) }));
  }

  /** The live screen. */
  public screen(): ScreenAnchor {
    return { centre: point(SCREEN.x, SCREEN.y, SCREEN.face + 0.002), width: SCREEN.width, height: SCREEN.height, pixels: SCREEN_PIXELS };
  }

  /** drei's `Html transform` maps 400 CSS px to `distanceFactor` units; this makes the interface fill the screen. */
  public screenDistanceFactor(): number {
    return (400 * SCREEN.width) / SCREEN_PIXELS.width;
  }

  /** The floating UI card. */
  public card(): CardPlacement {
    return { at: point(0.5, 1.2, 0.62), scale: 0.27, tilt: 0.38, yaw: 0.55, reach: 0.62 };
  }

  /** The desk lamp's bulb and the pool it lights. */
  public lamp(): LampAnchor {
    return { bulb: along(LAMP_HEAD, lampDirection(), 0.08), aim: LAMP_AIM, pool: 0.42 };
  }

  /** How far the toggle's knob slides either side of the track's middle. */
  public toggleTravel(): number {
    return TOGGLE.travel;
  }

  /** How far the button's cap sinks when pressed. */
  public buttonDepth(): number {
    return BUTTON.depth;
  }

  /** Where the slider's knob rests at each step, as offsets along x from the middle. */
  public sliderStops(): readonly number[] {
    return SLIDER.stops;
  }

  /** The cloud's path across the window pane: where it enters and leaves, along z. */
  public cloudPath(): Readonly<{ from: number; to: number }> {
    return { from: WINDOW.z - WINDOW.width / 2 + 0.08, to: WINDOW.z + WINDOW.width / 2 - 0.08 };
  }

  /** A layered plinth like a cake: honey floor planks over a band of earth and a darker foot. */
  private static plinth(): Solid[] {
    const width = (2 * HALF - (PLANKS - 1) * PLANK_GAP) / PLANKS;
    const planks = Array.from({ length: PLANKS }, (_, index): Solid =>
      block("floor", index % 2 === 0 ? "plank" : "plankAlt", point(-HALF + width / 2 + index * (width + PLANK_GAP), -PLANK / 2, 0), point(width, PLANK, 2 * HALF), 0.035),
    );
    return [
      ...planks,
      block("plinth", "earth", point(0, -PLANK - EARTH / 2, 0), point(2 * HALF, EARTH, 2 * HALF), 0.06),
      block("plinth", "bedrock", point(0, -PLANK - EARTH - BEDROCK / 2, 0), point(2 * HALF - 0.2, BEDROCK, 2 * HALF - 0.2), 0.05),
    ];
  }

  /** The back and left walls, capped with trim along their cut tops, with skirting at their feet. */
  private static walls(): Solid[] {
    const leftLength = HALF - INNER;
    return [
      block("wall", "wallBack", point(0, WALL_HEIGHT / 2, -HALF + WALL / 2), point(2 * HALF, WALL_HEIGHT, WALL), 0.05),
      block("wall", "wallLeft", point(-HALF + WALL / 2, WALL_HEIGHT / 2, (INNER + HALF) / 2), point(WALL, WALL_HEIGHT, leftLength), 0.05),
      block("trim", "trim", point(0, WALL_HEIGHT + 0.03, -HALF + 0.12), point(2 * HALF + 0.04, 0.06, 0.28), 0.025),
      block("trim", "trim", point(-HALF + 0.12, WALL_HEIGHT + 0.03, (-HALF + 0.27 + HALF + 0.02) / 2), point(0.28, 0.06, 2 * HALF - 0.25), 0.025),
      block("trim", "trim", point((INNER + HALF) / 2, 0.07, INNER + 0.03), point(HALF - INNER, 0.14, 0.06), 0.02),
      block("trim", "trim", point(INNER + 0.03, 0.07, (INNER + 0.06 + HALF) / 2), point(0.06, 0.14, HALF - INNER - 0.06), 0.02),
      ...DioramaLayout.wainscot(),
    ];
  }

  /** A darker panel along the foot of both walls, under a cream rail, so the walls are not one flat colour. */
  private static wainscot(): Solid[] {
    const bottom = 0.1;
    const top = 0.8;
    const panel = 0.025;
    const middle = (bottom + top) / 2;
    return [
      block("wall", "wainscot", point((INNER + HALF) / 2, middle, INNER + panel / 2), point(HALF - INNER, top - bottom, panel), 0.01),
      block("wall", "wainscot", point(INNER + panel / 2, middle, (INNER + panel + HALF) / 2), point(panel, top - bottom, HALF - INNER - panel), 0.01),
      block("trim", "trim", point((INNER + HALF) / 2, top, INNER + 0.03), point(HALF - INNER, 0.05, 0.06), 0.02),
      block("trim", "trim", point(INNER + 0.03, top, (INNER + 0.06 + HALF) / 2), point(0.06, 0.05, HALF - INNER - 0.06), 0.02),
    ];
  }

  /** A round pink pouf on the rug's right corner by the drawers, with a button in its cushion. */
  private static pouf(): Solid[] {
    const at = point(1.38, 0, 0.12);
    return [
      drum("pouf", "pink", point(at.x, 0.12, at.z), 0.29, 0.27, 0.24),
      ball("pouf", "pink", point(at.x, 0.25, at.z), 0.3, point(1, 0.42, 1)),
      ball("pouf", "cream", point(at.x, 0.375, at.z), 0.04, point(1, 0.5, 1)),
    ];
  }

  /** An orange rug with a cream border in front of the desk. */
  private static rug(): Solid[] {
    return [
      pad("rug", "rugEdge", point(0.42, 0.015, 0.42), point(2.3, 0.03, 1.72), 0.46),
      pad("rug", "rug", point(0.42, 0.025, 0.42), point(2.04, 0.04, 1.46), 0.34),
    ];
  }

  /** A chunky wooden desk on two legs and a cream drawer unit. */
  private static desk(): Solid[] {
    const centreX = (DESK.left + DESK.right) / 2;
    const centreZ = (DESK.back + DESK.front) / 2;
    const legHeight = DESK_TOP - DESK.slab;
    const drawers = point(1.47, legHeight / 2, centreZ);
    const front = DESK.front - 0.06 + 0.02;
    return [
      block("desk", "wood", point(centreX, DESK_TOP - DESK.slab / 2, centreZ), point(DESK.right - DESK.left, DESK.slab, DESK.front - DESK.back), 0.06),
      ...[DESK.back + 0.12, DESK.front - 0.12].map((z) => block("desk", "woodDark", point(DESK.left + 0.14, legHeight / 2, z), point(0.13, legHeight, 0.13), 0.04)),
      block("drawers", "cream", drawers, point(0.58, legHeight, 0.76), 0.05),
      ...[0.58, 0.22].flatMap((y) => [
        block("drawers", "cream", point(drawers.x, y, front), point(0.46, 0.28, 0.04), 0.03),
        ball("drawers", "sunny", point(drawers.x, y, front + 0.04), 0.045),
      ]),
    ];
  }

  /** A chunky cream monitor with a dark screen, on a short neck and a flat foot. */
  private static monitor(): Solid[] {
    const bottom = SCREEN.y - SCREEN.height / 2 - 0.08;
    return [
      block("monitor", "cream", point(SCREEN.x, SCREEN.y, SCREEN.face - 0.07), point(SCREEN.width + 0.16, SCREEN.height + 0.16, 0.14), 0.07),
      block("monitor", "screen", point(SCREEN.x, SCREEN.y, SCREEN.face - 0.01), point(SCREEN.width, SCREEN.height, 0.02), 0.01),
      block("monitor", "cream", point(SCREEN.x, SCREEN.y - 0.04, SCREEN.face - 0.19), point(0.9, 0.6, 0.12), 0.06),
      block("monitor", "cream", point(SCREEN.x, (DESK_TOP + bottom) / 2 + 0.02, SCREEN.face - 0.16), point(0.18, bottom - DESK_TOP + 0.04, 0.1), 0.04),
      block("monitor", "cream", point(SCREEN.x, DESK_TOP + 0.025, SCREEN.face - 0.1), point(0.56, 0.05, 0.32), 0.025),
    ];
  }

  /** A chunky keyboard: three rows of big keys, a space bar, and one orange key. */
  private static keyboard(): Solid[] {
    const centre = point(0.52, DESK_TOP, -1.0);
    const pitch = 0.1;
    const key = 0.078;
    const columns = 9;
    const keyY = DESK_TOP + 0.07 + 0.0175;
    const solids: Solid[] = [block("keyboard", "cream", point(centre.x, DESK_TOP + 0.035, centre.z), point(1.0, 0.07, 0.32), 0.035)];
    for (let row = 0; row < 3; row += 1) {
      const z = centre.z + (row - 1) * 0.09;
      for (let column = 0; column < columns; column += 1) {
        const space = row === 2 && column >= 2 && column <= 6;
        if (space && column !== 4) {
          continue;
        }
        const x = centre.x + (column - (columns - 1) / 2) * pitch;
        const width = space ? key + 4 * pitch : key;
        const tone: Tone = row === 0 && column === columns - 1 ? "signal" : "key";
        solids.push(block("keyboard", tone, point(x, keyY, z), point(width, 0.035, 0.07), 0.016));
      }
    }
    return solids;
  }

  /** A sunny mug of coffee. Its steam is three pieces of its own. */
  private static mug(): Solid[] {
    const body = point(MUG.x, MUG.y + 0.11, MUG.z);
    return [
      drum("mug", "sunny", body, 0.11, 0.1, 0.22),
      drum("mug", "coffee", point(body.x, body.y + 0.1, body.z), 0.092, 0.092, 0.025),
      { kind: "ring", part: "mug", tone: "sunny", at: point(body.x + 0.105, body.y, body.z), radius: 0.06, tube: 0.022, arc: Math.PI, turn: point(0, 0, -Math.PI / 2) },
    ];
  }

  /** The pegboard on the back wall: a cream board with a grid of holes, and two lines of "text" beside the checkbox. */
  private static board(): Solid[] {
    const solids: Solid[] = [block("pegboard", "board", point(-1.03, 1.62, INNER + 0.03), point(1.18, 1.42, 0.06), 0.045)];
    for (let column = 0; column < 9; column += 1) {
      for (let row = 0; row < 11; row += 1) {
        solids.push(drum("pegboard", "hole", point(-1.51 + column * 0.12, 0.98 + row * 0.128, BOARD_FACE + 0.001), 0.017, 0.017, 0.004, OUT_OF_BACK_WALL));
      }
    }
    solids.push(
      block("pegboard", "hole", point(-0.97, ROWS.check + 0.045, BOARD_FACE + 0.012), point(0.6, 0.07, 0.024), 0.03),
      block("pegboard", "hole", point(-1.07, ROWS.check - 0.055, BOARD_FACE + 0.012), point(0.4, 0.06, 0.024), 0.026),
    );
    return solids;
  }

  /** The pegboard's controls, each a piece: toggle, button, slider, stars and checkbox. */
  private static controls(): Piece[] {
    const face = BOARD_FACE;
    const knob = point(TOGGLE.x - TOGGLE.travel, ROWS.top, face + 0.11);
    const cap = point(BUTTON.x, ROWS.top, face + 0.12);
    const sliderKnob = point(SLIDER.x, ROWS.slider, face + 0.08);
    const tick = point(CHECKBOX_X, ROWS.check, face + 0.09);
    const pieces: Piece[] = [
      piece("toggle-track", point(TOGGLE.x, ROWS.top, face), { kind: "toggle" }, OFF_WALL, [
        block("control", "ink", point(TOGGLE.x, ROWS.top, face + 0.05), point(0.48, 0.22, 0.1), 0.1),
      ]),
      piece("toggle-knob", knob, { kind: "toggle" }, OFF_WALL, [ball("control", "sunny", knob, 0.085, point(1, 1, 0.8))], true),
      piece("button-base", point(BUTTON.x, ROWS.top, face), { kind: "button" }, OFF_WALL, [
        drum("control", "cream", point(BUTTON.x, ROWS.top, face + 0.03), 0.17, 0.17, 0.06, OUT_OF_BACK_WALL),
      ]),
      piece("button-cap", cap, { kind: "button" }, OFF_WALL, [drum("control", "signal", cap, 0.125, 0.135, 0.13, OUT_OF_BACK_WALL)]),
      piece("slider-track", point(SLIDER.x, ROWS.slider, face), { kind: "slider" }, OFF_WALL, [
        block("control", "ink", point(SLIDER.x, ROWS.slider, face + 0.03), point(0.86, 0.08, 0.06), 0.035),
      ]),
      piece("slider-knob", sliderKnob, { kind: "slider" }, OFF_WALL, [drum("control", "pink", sliderKnob, 0.085, 0.085, 0.1, OUT_OF_BACK_WALL)]),
    ];
    for (let star = 1; star <= STAR_COUNT; star += 1) {
      const at = point(-1.43 + (star - 1) * 0.2, ROWS.stars, face + 0.035);
      pieces.push(
        piece(`star-${star}` as StarPiece, at, { kind: "star", count: star }, OFF_WALL, [
          { kind: "star", part: "control", tone: "starOff", at, outer: 0.092, inner: 0.044, depth: 0.06 },
        ], true),
      );
    }
    pieces.push(
      piece("checkbox-box", point(CHECKBOX_X, ROWS.check, face), { kind: "checkbox" }, OFF_WALL, [
        block("control", "cream", point(CHECKBOX_X, ROWS.check, face + 0.04), point(0.24, 0.24, 0.08), 0.05),
      ]),
      piece("checkbox-tick", tick, { kind: "checkbox" }, OFF_WALL, [
        rod("control", "leafDark", point(tick.x - 0.06, tick.y + 0.0, tick.z), point(tick.x - 0.015, tick.y - 0.05, tick.z), 0.024),
        rod("control", "leafDark", point(tick.x - 0.015, tick.y - 0.05, tick.z), point(tick.x + 0.075, tick.y + 0.07, tick.z), 0.024),
      ]),
    );
    return pieces;
  }

  /** An ink desk lamp with a cream shade, standing at the back right of the desk and leaning over the mug. */
  private static lampPieces(): Piece[] {
    const aim = lampDirection();
    const shadeTop = along(LAMP_HEAD, aim, -0.09);
    return [
      piece("lamp-stand", LAMP_FOOT, { kind: "lamp" }, UPWARD, [
        drum("lamp", "ink", LAMP_FOOT, 0.13, 0.14, 0.05),
        rod("lamp", "ink", point(LAMP_FOOT.x, LAMP_FOOT.y + 0.02, LAMP_FOOT.z), LAMP_ELBOW, 0.035),
        ball("lamp", "sunny", LAMP_ELBOW, 0.055),
        rod("lamp", "ink", LAMP_ELBOW, shadeTop, 0.035),
      ]),
      piece("lamp-head", shadeTop, { kind: "lamp" }, UPWARD, [
        ball("lamp", "ink", shadeTop, 0.05),
        drum("lamp", "cream", LAMP_HEAD, 0.07, 0.18, 0.22, pointing(minus(point(0, 0, 0), aim))),
        ball("lamp", "bulb", along(LAMP_HEAD, aim, 0.08), 0.065),
      ]),
    ];
  }

  /** A rubber duck at the front left of the desk, facing out: body, head, beak, eyes and a tail. */
  private static duck(): Piece {
    const facing = point(Math.sin(DUCK_FACING), 0, Math.cos(DUCK_FACING));
    const side = point(Math.cos(DUCK_FACING), 0, -Math.sin(DUCK_FACING));
    const body = point(DUCK.x, DUCK.y + 0.12, DUCK.z);
    const head = along(along(DUCK, facing, 0.07), point(0, 1, 0), 0.31);
    const eye = (way: number): Solid => ball("duck", "ink", along(along(along(head, facing, 0.078), side, way * 0.042), point(0, 1, 0), 0.025), 0.017);
    return piece("duck", DUCK, { kind: "duck" }, UPWARD, [
      ball("duck", "sunny", body, 0.14, point(1.0, 0.82, 1.0)),
      ball("duck", "sunny", along(along(body, facing, -0.13), point(0, 1, 0), 0.07), 0.065, point(1, 0.8, 1.2), point(0.5, DUCK_FACING, 0)),
      ball("duck", "sunny", head, 0.1),
      ball("duck", "signal", along(along(head, facing, 0.1), point(0, 1, 0), -0.02), 0.052, point(0.95, 0.5, 1.45), point(0, DUCK_FACING, 0)),
      eye(-1),
      eye(1),
    ]);
  }

  /** A big pink pot in the front-left corner with a crown of big leaves, which sway as one piece. */
  private static plant(): Piece[] {
    const pot = point(PLANT.x, POT_HEIGHT / 2, PLANT.z);
    const soil = point(PLANT.x, POT_HEIGHT + 0.01, PLANT.z);
    return [
      piece("plant-pot", PLANT, { kind: "plant" }, STILL, [
        drum("plant", "pink", pot, 0.25, 0.2, POT_HEIGHT),
        drum("plant", "pink", point(pot.x, POT_HEIGHT - 0.03, pot.z), 0.29, 0.29, 0.08),
        drum("plant", "coffee", soil, 0.25, 0.25, 0.02),
      ]),
      piece("plant-leaves", soil, { kind: "plant" }, STILL, crown(soil, 8, 0.36, [0.55, 0.98, 0.78])),
    ];
  }

  /** Three puffs of steam over the mug. */
  private static steam(): Piece[] {
    const base = point(MUG.x, MUG.y + 0.26, MUG.z);
    return ([1, 2, 3] as const).map((index) => piece(`steam-${index}`, base, null, STILL, [ball("steam", "steam", base, 0.055)]));
  }

  /** A small cloud on the window pane; it drifts along the pane from one side to the other. */
  private static cloud(): Piece {
    const x = INNER + 0.024;
    const centre = point(x, WINDOW.y - 0.22, 0);
    const flat = point(0.3, 0.85, 1);
    return piece("cloud", centre, null, STILL, [
      ball("cloud", "cloud", centre, 0.1, flat),
      ball("cloud", "cloud", point(x, centre.y + 0.05, centre.z - 0.11), 0.085, flat),
      ball("cloud", "cloud", point(x, centre.y - 0.01, centre.z + 0.12), 0.07, flat),
    ]);
  }

  /** A window on the left wall: a sky pane with a sun, a cream frame, a cross of glazing bars and a sill. */
  private static window(): Solid[] {
    const { z, y, width, height } = WINDOW;
    const top = y + height / 2;
    const bottom = y - height / 2;
    return [
      block("window", "sky", point(INNER + 0.01, y, z), point(0.02, height, width), 0.005),
      drum("window", "sunny", point(INNER + 0.022, top - 0.24, z - width / 2 + 0.26), 0.12, 0.12, 0.008, OUT_OF_LEFT_WALL),
      block("window", "trim", point(INNER + 0.04, top + 0.04, z), point(0.08, 0.1, width + 0.18), 0.03),
      block("window", "trim", point(INNER + 0.08, bottom - 0.04, z), point(0.16, 0.1, width + 0.26), 0.03),
      block("window", "trim", point(INNER + 0.04, y, z - width / 2 - 0.045), point(0.08, height, 0.09), 0.03),
      block("window", "trim", point(INNER + 0.04, y, z + width / 2 + 0.045), point(0.08, height, 0.09), 0.03),
      block("window", "trim", point(INNER + 0.035, y, z), point(0.05, height, 0.05), 0.02),
      block("window", "trim", point(INNER + 0.035, y + 0.04, z), point(0.05, 0.05, width), 0.02),
    ];
  }

  /** A wooden shelf on the left wall with a row of books, one leaning, and a little potted succulent. */
  private static shelf(): Solid[] {
    const top = 1.41;
    const x = INNER + 0.13;
    const books: readonly (readonly [number, number, number, Tone])[] = [
      [0.42, 0.08, 0.34, "signal"],
      [0.51, 0.07, 0.29, "sunny"],
      [0.595, 0.08, 0.37, "leafDark"],
      [0.68, 0.07, 0.27, "pink"],
      [0.76, 0.075, 0.32, "cream"],
    ];
    const succulent = point(x, top + 0.065, 1.38);
    return [
      block("shelf", "wood", point(x, top - 0.03, 0.9), point(0.28, 0.06, 1.12), 0.025),
      ...[0.48, 1.32].map((z) => block("shelf", "woodDark", point(INNER + 0.06, top - 0.11, z), point(0.12, 0.12, 0.05), 0.02)),
      ...books.map(([z, thick, height, tone]) => block("shelf", tone, point(x, top + height / 2, z), point(0.2, height, thick), 0.02)),
      block("shelf", "sunny", point(x, top + 0.13, 0.9), point(0.2, 0.3, 0.075), 0.02, point(-0.38, 0, 0)),
      block("shelf", "pink", point(x, top + 0.03, 1.13), point(0.22, 0.06, 0.28), 0.02),
      block("shelf", "signal", point(x, top + 0.09, 1.13), point(0.2, 0.06, 0.26), 0.02),
      drum("shelf", "cream", succulent, 0.08, 0.065, 0.13),
      ...[-0.6, 0, 0.6].map((lean) =>
        ball("shelf", "leaf", point(succulent.x + Math.sin(lean) * 0.03, succulent.y + 0.1, succulent.z + Math.sin(lean) * 0.05), 0.05, point(0.7, 1.3, 0.7), point(lean, 0, 0)),
      ),
    ];
  }

  /** A framed print of a UI on the left wall, above the shelf: a card with an orange dot, two lines and a button. */
  private static print(): Solid[] {
    const x = INNER;
    const centre = point(x + 0.025, 2.04, 1.12);
    return [
      block("print", "ink", centre, point(0.05, 0.56, 0.48), 0.02),
      block("print", "cream", point(x + 0.045, centre.y, centre.z), point(0.02, 0.46, 0.38), 0.01),
      drum("print", "signal", point(x + 0.058, centre.y + 0.1, centre.z - 0.08), 0.065, 0.065, 0.01, OUT_OF_LEFT_WALL),
      block("print", "hole", point(x + 0.058, centre.y + 0.13, centre.z + 0.07), point(0.008, 0.035, 0.16), 0.004),
      block("print", "hole", point(x + 0.058, centre.y + 0.07, centre.z + 0.05), point(0.008, 0.035, 0.12), 0.004),
      block("print", "sunny", point(x + 0.058, centre.y - 0.11, centre.z), point(0.01, 0.08, 0.24), 0.005),
    ];
  }
}

/** The unit direction the lamp's shade points: from its centre to the spot it lights. */
function lampDirection(): Point3 {
  return unit(minus(LAMP_AIM, LAMP_HEAD));
}

/** Big leaves fanned round `base`, leaning out by turns, every third one longer, in two greens. */
function crown(base: Point3, count: number, size: number, leans: readonly number[]): Solid[] {
  const leaves: Solid[] = [];
  for (let leaf = 0; leaf < count; leaf += 1) {
    const around = (leaf / count) * Math.PI * 2 + 0.4;
    const lean = leans[leaf % leans.length];
    const reach = leaf % 3 === 0 ? size * 1.18 : size;
    const direction = point(Math.sin(lean) * Math.cos(around), Math.cos(lean), -Math.sin(lean) * Math.sin(around));
    leaves.push({
      kind: "ball",
      part: "plant",
      tone: leaf % 2 === 0 ? "leaf" : "leafDark",
      at: along(base, direction, reach * 0.95),
      radius: reach,
      stretch: point(0.62, 1, 0.13),
      turn: point(0, around, -lean),
    });
  }
  return leaves;
}

function piece(id: PieceId, pivot: Point3, target: Target | null, lift: Point3, solids: readonly Solid[], tinted = false): Piece {
  return { id, pivot, target, lift, solids, tinted };
}

function block(part: Part, tone: Tone, at: Point3, size: Point3, radius: number, turn?: Turn): Solid {
  return { kind: "block", part, tone, at, size, radius, turn };
}

function pad(part: Part, tone: Tone, at: Point3, size: Point3, corner: number): Solid {
  return { kind: "pad", part, tone, at, size, corner };
}

function drum(part: Part, tone: Tone, at: Point3, top: number, bottom: number, height: number, turn?: Turn): Solid {
  return { kind: "drum", part, tone, at, top, bottom, height, turn };
}

function ball(part: Part, tone: Tone, at: Point3, radius: number, stretch?: Point3, turn?: Turn): Solid {
  return { kind: "ball", part, tone, at, radius, stretch, turn };
}

function rod(part: Part, tone: Tone, from: Point3, to: Point3, radius: number): Solid {
  if (!(length(minus(to, from)) > 0)) {
    throw new Error(`A rod needs two different ends`);
  }
  return { kind: "rod", part, tone, from, to, radius };
}
