import { solidExtent, unionExtent, type ClaySolid, type ClayTone, type RoomPart, type Turn } from "./ClaySolid";
import { along, length, minus, point, unit, type Extent, type Point3 } from "./space";

/** Where the live screen sits: its centre, size in metres, the way it faces, and the DOM size drawn on it. */
export type ScreenAnchor = Readonly<{
  centre: Point3;
  width: number;
  height: number;
  /** The unit direction the screen faces. */
  normal: Point3;
  /** The interface's size in CSS pixels; it is laid out at this size and scaled onto the screen. */
  pixels: Readonly<{ width: number; height: number }>;
}>;

/** A floating UI card: where it hangs, how big it is, and how it is turned toward the viewer. */
export type CardPlacement = Readonly<{
  at: Point3;
  /** Metres per card unit; the card blueprint is 2.5 × 3.5 units. */
  scale: number;
  /**
   * Tips the card's face up out of the floor plane toward the front, in radians. Kept well short of upright,
   * so the layers separate across the view rather than straight toward the camera.
   */
  tilt: number;
  /** Then turns it toward the right wall, in radians. */
  yaw: number;
}>;

/** The desk lamp: where its bulb is and the point on the desk it lights. */
export type LampAnchor = Readonly<{ bulb: Point3; aim: Point3 }>;

/** The room's shell: a plinth from the back-left corner to the open front-right edges, walls on its back and left. */
const BACK = -3;
const LEFT = -3;
const RIGHT = 2.5;
const FRONT = 0.3;
const PLINTH = 0.3;
const WALL = 0.16;
const WALL_HEIGHT = 2.7;
/** The inner faces of the back and left walls (the same number, as the corner is square). */
const INSIDE = BACK + WALL;

/** The desk: centred on x, its back a little off the back wall. */
const DESK_X = 0.3;
const DESK_Z = -2.26;
const DESK_TOP = 0.76;
const DESK_WIDTH = 2.3;
const DESK_DEPTH = 0.95;
const DESK_SLAB = 0.06;

/** The monitor's screen, 16:10, and the panel's distance from the wall. */
const SCREEN_WIDTH = 1.12;
const SCREEN_HEIGHT = 0.7;
const SCREEN_Y = 1.27;
const PANEL_Z = -2.52;
const PANEL_DEPTH = 0.035;
const SCREEN_PIXELS = { width: 1440, height: 900 } as const;

/** The pegboard on the left wall, and the plane its tiles stand out from. */
const BOARD_FACE = INSIDE + 0.035;

/** Euler angles that turn a shape's +y axis to point along `direction` (x first, then z, with no y turn). */
export function pointing(direction: Point3): Turn {
  const d = unit(direction);
  const side = Math.sqrt(Math.max(0, 1 - d.x * d.x));
  return point(side === 0 ? 0 : Math.atan2(d.z, d.y), 0, Math.asin(-d.x));
}

/**
 * Every prop in the workbench room, its size and place, in one table. Owns the rules that the room is a
 * cut-away (a plinth and two walls, open to the viewer), that the desk props rest on the desk top, that the
 * pegboard tiles stand on the board, and that the live screen sits on the monitor's face. Built once.
 */
export class RoomLayout {
  private readonly all: readonly ClaySolid[];
  private readonly bounds: Extent;

  public constructor() {
    this.all = [
      ...RoomLayout.shell(),
      ...RoomLayout.desk(),
      ...RoomLayout.monitor(),
      ...RoomLayout.keyboard(),
      ...RoomLayout.deskThings(),
      ...RoomLayout.fig(),
      ...RoomLayout.lampSolids(),
      ...RoomLayout.chair(),
      ...RoomLayout.pegboard(),
      ...RoomLayout.walls(),
    ];
    this.bounds = unionExtent(this.all.map(solidExtent));
  }

  /** Every solid, in no particular order. */
  public solids(): readonly ClaySolid[] {
    return this.all;
  }

  /** The solids of one prop. */
  public part(part: RoomPart): readonly ClaySolid[] {
    return this.all.filter((solid) => solid.part === part);
  }

  /** The box the whole room fits in. */
  public extent(): Extent {
    return this.bounds;
  }

  /** The height of the desk's top surface. */
  public deskTop(): number {
    return DESK_TOP;
  }

  /** What the camera looks at as it approaches the desk: the monitor, a little low. */
  public deskFocus(): Point3 {
    return point(DESK_X, 1.12, DESK_Z + 0.05);
  }

  /** The live screen. */
  public screen(): ScreenAnchor {
    return {
      centre: point(DESK_X, SCREEN_Y, PANEL_Z + PANEL_DEPTH / 2 + 0.001),
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      normal: point(0, 0, 1),
      pixels: SCREEN_PIXELS,
    };
  }

  /** drei's `Html transform` maps 400 CSS px to `distanceFactor` metres; this makes the interface fill the screen. */
  public screenDistanceFactor(): number {
    return (400 * SCREEN_WIDTH) / SCREEN_PIXELS.width;
  }

  /** The floating UI cards, in the order they explode. */
  public cards(): readonly CardPlacement[] {
    return [
      { at: point(-0.98, 1.55, -1.85), scale: 0.16, tilt: 0.5, yaw: 0.55 },
      { at: point(1.95, 1.85, -1.5), scale: 0.13, tilt: 0.5, yaw: 0.3 },
      { at: point(-1.75, 1.15, -1.05), scale: 0.11, tilt: 0.55, yaw: 0.8 },
    ];
  }

  /** The desk lamp's bulb and where it points. */
  public lamp(): LampAnchor {
    return { bulb: along(LAMP_HEAD, lampDirection(), 0.06), aim: LAMP_AIM };
  }

  /** The floor plinth and the rug on it. */
  private static shell(): ClaySolid[] {
    return [
      block("plinth", "floor", point((LEFT + RIGHT) / 2, -PLINTH / 2, (BACK + FRONT) / 2), point(RIGHT - LEFT, PLINTH, FRONT - BACK), 0.04),
      block("rug", "rug", point(0.55, 0.006, -1.45), point(2.6, 0.012, 1.9), 0.005),
    ];
  }

  /** The back and left walls, with a shelf and a poster on the back wall. */
  private static walls(): ClaySolid[] {
    const wallY = WALL_HEIGHT / 2;
    const shelfTop = 1.9675;
    const books: readonly (readonly [number, number, number, ClayTone])[] = [
      [-2.22, 0.05, 0.27, "white"],
      [-2.16, 0.04, 0.23, "stone"],
      [-2.105, 0.045, 0.25, "ink"],
      [-2.05, 0.04, 0.21, "white"],
    ];
    return [
      block("wall", "plaster", point((LEFT + RIGHT) / 2, wallY, BACK + WALL / 2), point(RIGHT - LEFT, WALL_HEIGHT, WALL), 0.02),
      block("wall", "plaster", point(LEFT + WALL / 2, wallY, (BACK + FRONT) / 2), point(WALL, WALL_HEIGHT, FRONT - BACK), 0.02),
      block("shelf", "white", point(-1.75, shelfTop - 0.0175, INSIDE + 0.11), point(1.1, 0.035, 0.22), 0.008),
      ...books.map(([x, width, height, tone]) =>
        block("shelf", tone, point(x, shelfTop + height / 2, INSIDE + 0.1), point(width, height, 0.17), 0.006),
      ),
      drum("shelf", "stone", point(-1.72, shelfTop + 0.07, INSIDE + 0.1), 0.045, 0.035, 0.14),
      ball("shelf", "ink", point(-1.45, shelfTop + 0.06, INSIDE + 0.1), 0.06),
      block("poster", "ink", point(1.95, 1.95, INSIDE + 0.015), point(0.72, 0.95, 0.03), 0.008),
      block("poster", "paper", point(1.95, 1.95, INSIDE + 0.032), point(0.66, 0.89, 0.006), 0.002),
      drum("poster", "signal", point(1.95, 2.06, INSIDE + 0.037), 0.17, 0.17, 0.004, point(Math.PI / 2, 0, 0)),
      block("poster", "ink", point(1.85, 1.66, INSIDE + 0.037), point(0.36, 0.028, 0.004), 0.002),
      block("poster", "stone", point(1.8, 1.6, INSIDE + 0.037), point(0.26, 0.018, 0.004), 0.002),
    ];
  }

  /** The desk: a wooden top on four ink legs, and a drawer unit under its right side. */
  private static desk(): ClaySolid[] {
    const legX = DESK_WIDTH / 2 - 0.1;
    const legZ = DESK_DEPTH / 2 - 0.09;
    const legs = [-1, 1].flatMap((sideX) =>
      [-1, 1].map((sideZ) =>
        rod("desk", "ink", point(DESK_X + sideX * legX, 0.028, DESK_Z + sideZ * legZ), point(DESK_X + sideX * legX, DESK_TOP - DESK_SLAB, DESK_Z + sideZ * legZ), 0.028),
      ),
    );
    const drawersX = 0.95;
    const drawersFront = DESK_Z - 0.04 + 0.39;
    return [
      block("desk", "wood", point(DESK_X, DESK_TOP - DESK_SLAB / 2, DESK_Z), point(DESK_WIDTH, DESK_SLAB, DESK_DEPTH), 0.025),
      ...legs,
      block("drawers", "white", point(drawersX, 0.31, DESK_Z - 0.04), point(0.5, 0.62, 0.78), 0.03),
      ...[0.5, 0.26].map((y) => rod("drawers", "ink", point(drawersX - 0.1, y, drawersFront + 0.012), point(drawersX + 0.1, y, drawersFront + 0.012), 0.011)),
    ];
  }

  /** A thin ink panel on a hinge, a neck and a flat foot. */
  private static monitor(): ClaySolid[] {
    const back = PANEL_Z - PANEL_DEPTH / 2;
    return [
      block("monitor", "ink", point(DESK_X, SCREEN_Y, PANEL_Z), point(SCREEN_WIDTH + 0.05, SCREEN_HEIGHT + 0.05, PANEL_DEPTH), 0.012),
      block("monitor", "metal", point(DESK_X, 1.2, back - 0.017), point(0.14, 0.12, 0.04), 0.01),
      block("monitor", "metal", point(DESK_X, (DESK_TOP + 0.01 + 1.19) / 2, back - 0.04), point(0.07, 1.19 - DESK_TOP - 0.01, 0.03), 0.01),
      block("monitor", "metal", point(DESK_X, DESK_TOP + 0.009, PANEL_Z + 0.02), point(0.36, 0.018, 0.24), 0.008),
    ];
  }

  /** A low keyboard of white keys, the return key in orange, and a mouse beside it. */
  private static keyboard(): ClaySolid[] {
    const centreX = 0.25;
    const centreZ = -2.0;
    const pitch = 0.046;
    const key = 0.036;
    const keyY = DESK_TOP + 0.025 + 0.006;
    const columns = 13;
    const solids: ClaySolid[] = [
      block("keyboard", "metal", point(centreX, DESK_TOP + 0.0125, centreZ), point(0.64, 0.025, 0.21), 0.01),
    ];
    for (let row = 0; row < 4; row += 1) {
      const z = centreZ + (row - 1.5) * pitch;
      for (let column = 0; column < columns; column += 1) {
        const x = centreX + (column - (columns - 1) / 2) * pitch;
        const space = row === 3 && column >= 4 && column <= 8;
        if (space && column !== 6) {
          continue;
        }
        const width = space ? key + 4 * pitch : key;
        const tone: ClayTone = row === 1 && column === columns - 1 ? "signal" : "white";
        solids.push(block("keyboard", tone, point(x, keyY, z), point(width, 0.012, key), 0.005));
      }
    }
    solids.push(ball("mouse", "white", point(0.78, DESK_TOP + 0.0152, -1.98), 0.04, point(0.75, 0.38, 1.15)));
    return solids;
  }

  /** A mug of coffee and a potted plant. */
  private static deskThings(): ClaySolid[] {
    const mug = point(-0.5, DESK_TOP + 0.06, -1.95);
    const pot = point(-0.55, DESK_TOP + 0.09, -2.45);
    const soil = pot.y + 0.09;
    return [
      drum("mug", "white", mug, 0.05, 0.046, 0.12),
      drum("mug", "ink", point(mug.x, mug.y + 0.052, mug.z), 0.044, 0.044, 0.012),
      { kind: "ring", part: "mug", tone: "white", at: point(mug.x + 0.05, mug.y, mug.z), radius: 0.032, tube: 0.009, arc: Math.PI, turn: point(0, 0, -Math.PI / 2) },
      drum("plant", "stone", pot, 0.085, 0.065, 0.18),
      soilOn("plant", point(pot.x, soil, pot.z), 0.075),
      ...RoomLayout.crown("plant", point(pot.x, soil, pot.z), 7, 0.16, [0.42, 0.62]),
    ];
  }

  /** A tall potted plant in the open front-left corner, so the floor there is not bare. */
  private static fig(): ClaySolid[] {
    const pot = point(-2.3, 0.21, -0.05);
    return [
      drum("fig", "white", pot, 0.19, 0.15, 0.42),
      soilOn("fig", point(pot.x, 0.42, pot.z), 0.17),
      ...RoomLayout.crown("fig", point(pot.x, 0.42, pot.z), 9, 0.36, [0.3, 0.55, 0.75]),
    ];
  }

  /** Long leaves fanned round `base`, every other one leaning further out, a few of them longer. */
  private static crown(part: RoomPart, base: Point3, count: number, size: number, leans: readonly number[]): ClaySolid[] {
    const leaves: ClaySolid[] = [];
    for (let leaf = 0; leaf < count; leaf += 1) {
      const around = (leaf / count) * Math.PI * 2 + 0.3;
      const lean = leans[leaf % leans.length];
      const length = leaf % 3 === 0 ? size * 1.2 : size;
      const direction = point(Math.sin(lean) * Math.cos(around), Math.cos(lean), -Math.sin(lean) * Math.sin(around));
      leaves.push({
        kind: "ball",
        part,
        tone: "leaf",
        at: along(base, direction, length * 0.9),
        radius: length,
        stretch: point(0.26, 1, 0.1),
        turn: point(0, around, -lean),
      });
    }
    return leaves;
  }

  /** An ink desk lamp: a round foot, two arms with a joint, and a cone shade over a warm bulb. */
  private static lampSolids(): ClaySolid[] {
    const foot = point(1.2, DESK_TOP + 0.0125, -2.48);
    const elbow = point(1.12, 1.32, -2.58);
    const aim = lampDirection();
    const shadeTop = along(LAMP_HEAD, aim, -0.07);
    return [
      drum("lamp", "ink", foot, 0.085, 0.09, 0.025),
      rod("lamp", "ink", point(foot.x, foot.y + 0.01, foot.z), elbow, 0.014),
      ball("lamp", "ink", elbow, 0.026),
      rod("lamp", "ink", elbow, shadeTop, 0.014),
      drum("lamp", "ink", LAMP_HEAD, 0.035, 0.085, 0.13, pointing(minus(point(0, 0, 0), aim))),
      ball("lamp", "bulb", along(LAMP_HEAD, aim, 0.045), 0.032),
    ];
  }

  /** A white task chair on an ink five-star base, pulled out and turned toward the viewer. */
  private static chair(): ClaySolid[] {
    const pivot = point(1.25, 0, -1.15);
    const turn = -0.6;
    const place = (x: number, y: number, z: number): Point3 =>
      point(pivot.x + x * Math.cos(turn) + z * Math.sin(turn), y, pivot.z - x * Math.sin(turn) + z * Math.cos(turn));
    const solids: ClaySolid[] = [
      block("chair", "white", place(0, 0.46, 0), point(0.48, 0.06, 0.46), 0.025, point(0, turn, 0)),
      block("chair", "white", place(0, 0.8, 0.22), point(0.46, 0.46, 0.05), 0.022, point(0, turn, 0)),
      rod("chair", "metal", place(0, 0.08, 0), place(0, 0.43, 0), 0.025),
      rod("chair", "ink", place(0, 0.5, 0.21), place(0, 0.62, 0.21), 0.016),
    ];
    for (let spoke = 0; spoke < 5; spoke += 1) {
      const angle = (spoke / 5) * Math.PI * 2;
      const end = place(Math.cos(angle) * 0.27, 0.05, Math.sin(angle) * 0.27);
      solids.push(rod("chair", "ink", place(0, 0.07, 0), end, 0.018));
      solids.push(ball("chair", "ink", point(end.x, 0.025, end.z), 0.025));
    }
    return solids;
  }

  /** A perforated board on the left wall with UI components as chunky tiles: button, toggle, avatar, slider, checkbox, rating. */
  private static pegboard(): ClaySolid[] {
    const solids: ClaySolid[] = [block("pegboard", "board", point(INSIDE + 0.015, 1.75, -1.05), point(0.03, 1.25, 2.0), 0.01)];
    const sideways = point(0, 0, Math.PI / 2);
    for (let z = -1.95; z <= -0.14; z += 0.15) {
      for (let y = 1.22; y <= 2.3; y += 0.15) {
        solids.push(drum("pegboard", "ink", point(BOARD_FACE, y, z), 0.011, 0.011, 0.003, sideways));
      }
    }
    // Facing the board you look toward −x, so the visitor's left is +z: rows read from high z to low z.
    const out = (depth: number): number => BOARD_FACE + depth / 2;
    solids.push(
      drum("tile", "white", point(out(0.03), 2.12, -0.3), 0.12, 0.12, 0.03, sideways),
      ball("tile", "stone", point(out(0.03) + 0.02, 2.16, -0.3), 0.04, point(0.4, 1, 1)),
      ball("tile", "stone", point(out(0.03) + 0.015, 2.05, -0.3), 0.065, point(0.4, 0.5, 1)),
      block("tile", "ink", point(out(0.04), 2.12, -0.85), point(0.04, 0.14, 0.27), 0.02),
      ball("tile", "white", point(out(0.04) + 0.02, 2.12, -0.91), 0.05, point(0.6, 1, 1)),
      block("tile", "signal", point(out(0.04), 2.12, -1.55), point(0.04, 0.15, 0.42), 0.02),
      block("tile", "white", point(out(0.04) + 0.022, 2.12, -1.55), point(0.006, 0.026, 0.2), 0.003),
      block("tile", "stone", point(out(0.02), 1.68, -1.45), point(0.02, 0.03, 0.5), 0.009),
      block("tile", "signal", point(out(0.024), 1.68, -1.325), point(0.024, 0.032, 0.25), 0.01),
      drum("tile", "white", point(out(0.04), 1.68, -1.45), 0.045, 0.045, 0.04, sideways),
      block("tile", "white", point(out(0.04), 1.68, -0.8), point(0.04, 0.15, 0.15), 0.02),
      rod("tile", "ink", point(out(0.04) + 0.022, 1.685, -0.765), point(out(0.04) + 0.022, 1.65, -0.79), 0.009),
      rod("tile", "ink", point(out(0.04) + 0.022, 1.65, -0.79), point(out(0.04) + 0.022, 1.72, -0.84), 0.009),
    );
    for (let star = 0; star < 5; star += 1) {
      solids.push({
        kind: "star",
        part: "tile",
        tone: star < 3 ? "signal" : "stone",
        at: point(out(0.03), 1.3, -1.15 - star * 0.14),
        outer: 0.06,
        inner: 0.027,
        depth: 0.03,
        turn: point(0, Math.PI / 2, 0),
      });
    }
    return solids;
  }
}

/** The lamp's shade, and the spot on the desk it lights, beside the keyboard. */
const LAMP_HEAD = point(0.92, 1.4, -2.22);
const LAMP_AIM = point(0.62, DESK_TOP, -2.0);
/** The unit direction the shade points: from its centre to the spot it lights. */
function lampDirection(): Point3 {
  return unit(minus(LAMP_AIM, LAMP_HEAD));
}

function block(part: RoomPart, tone: ClayTone, at: Point3, size: Point3, radius: number, turn?: Turn): ClaySolid {
  return { kind: "block", part, tone, at, size, radius, turn };
}

function drum(part: RoomPart, tone: ClayTone, at: Point3, top: number, bottom: number, height: number, turn?: Turn): ClaySolid {
  return { kind: "drum", part, tone, at, top, bottom, height, turn };
}

function ball(part: RoomPart, tone: ClayTone, at: Point3, radius: number, stretch?: Point3): ClaySolid {
  return { kind: "ball", part, tone, at, radius, stretch };
}

/** A thin disc of soil on a pot whose rim is at `rim`: a few millimetres proud of it, so the two faces never fight for depth. */
function soilOn(part: RoomPart, rim: Point3, radius: number): ClaySolid {
  return drum(part, "ink", point(rim.x, rim.y - 0.005, rim.z), radius, radius, 0.02);
}

function rod(part: RoomPart, tone: ClayTone, from: Point3, to: Point3, radius: number): ClaySolid {
  if (!(length(minus(to, from)) > 0)) {
    throw new Error(`A rod needs two different ends`);
  }
  return { kind: "rod", part, tone, from, to, radius };
}
