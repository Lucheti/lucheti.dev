import type { AgentStationId } from "@/content";
import { clamp01, easeInOutSine, lerp } from "./easing";

/** A point on the stage, in stage units (the SVG's viewBox). */
export type Point = Readonly<{ x: number; y: number }>;
/** A box on the stage, in stage units. */
export type Rect = Readonly<{ x: number; y: number; width: number; height: number }>;
/** One row of stations for wide panels, two rows for narrow ones. */
export type StageKind = "wide" | "compact";

/** How the stations are laid out: rows of tiles, each with a lane of floor above it where the agent walks. */
export type StageArrangement = Readonly<{
  kind: StageKind;
  width: number;
  height: number;
  /** The stations in each row, left to right as drawn. */
  rows: readonly (readonly AgentStationId[])[];
  /** Per row: the y of the agent's feet in the lane above its tiles. */
  lanes: readonly number[];
  /** Per row: the top edge of its tiles. */
  tileTops: readonly number[];
  tile: Readonly<{ width: number; height: number }>;
  /** A walk lasts `baseMs` plus `perColumnMs` for each column it crosses. */
  walk: Readonly<{ baseMs: number; perColumnMs: number }>;
  /** A change of row is a hop over the tiles: how long it lasts and how high it goes. */
  hop: Readonly<{ ms: number; height: number }>;
}>;

/** Where the agent is on a leg: the floor point under it, how high it is off the floor, and its footsteps so far. */
export type LegPosition = Readonly<{ ground: Point; lift: number; stride: number }>;

/** One way of getting from a station to the next. */
export interface Leg {
  /** How long it takes, in ms. */
  readonly durationMs: number;
  /** Whether the agent leaves the floor on the way. */
  readonly airborne: boolean;
  /** Where the agent is `progress` (0 to 1) of the way along. */
  at(progress: number): LegPosition;
}

/** Stage units covered by one footstep. */
const STRIDE = 26;

/** The parts of a hop, as progress through it: a crouch until `takeoff`, the flight, and a landing after `touchdown`. */
export const HOP_PHASES = { takeoff: 0.16, touchdown: 0.86 } as const;

/** Along the floor, easing in and out, with footsteps counted by the distance walked. */
class WalkLeg implements Leg {
  public readonly airborne = false;
  private readonly length: number;

  public constructor(
    private readonly from: Point,
    private readonly to: Point,
    public readonly durationMs: number,
  ) {
    this.length = Math.hypot(to.x - from.x, to.y - from.y);
  }

  /** Where the agent is, part way along the walk. */
  public at(progress: number): LegPosition {
    const eased = easeInOutSine(progress);
    return {
      ground: { x: lerp(this.from.x, this.to.x, eased), y: lerp(this.from.y, this.to.y, eased) },
      lift: 0,
      stride: (eased * this.length) / STRIDE,
    };
  }
}

/** A jump between rows: a crouch, an arc through the air, a landing. */
class HopLeg implements Leg {
  public readonly airborne = true;

  public constructor(
    private readonly from: Point,
    private readonly to: Point,
    public readonly durationMs: number,
    private readonly height: number,
  ) {}

  /** Where the agent is, part way through the hop. */
  public at(progress: number): LegPosition {
    const flight = clamp01((progress - HOP_PHASES.takeoff) / (HOP_PHASES.touchdown - HOP_PHASES.takeoff));
    return {
      ground: { x: lerp(this.from.x, this.to.x, flight), y: lerp(this.from.y, this.to.y, flight) },
      lift: this.height * Math.sin(Math.PI * flight),
      stride: 0,
    };
  }
}

type Place = Readonly<{ row: number; column: number }>;

/**
 * The geometry of the stage: where each station's tile sits, where the agent stands to use it, and how
 * it travels between two of them (a walk along a lane, or a hop to the next row).
 */
export class StageLayout {
  private readonly places: ReadonlyMap<AgentStationId, Place>;
  private readonly columnWidth: number;

  public constructor(private readonly arrangement: StageArrangement) {
    const { rows, lanes, tileTops, tile, width, height } = arrangement;
    if (rows.length === 0 || lanes.length !== rows.length || tileTops.length !== rows.length) {
      throw new Error("Each row needs one lane and one tile top");
    }
    if (!(width > 0 && height > 0 && tile.width > 0 && tile.height > 0)) {
      throw new Error("A stage and its tiles need a positive size");
    }
    const places = new Map<AgentStationId, Place>();
    rows.forEach((row, rowIndex) => {
      if (lanes[rowIndex] >= tileTops[rowIndex]) {
        throw new Error(`Row ${rowIndex}'s lane must be above its tiles`);
      }
      row.forEach((station, column) => {
        if (places.has(station)) {
          throw new Error(`Station ${station} is laid out twice`);
        }
        places.set(station, { row: rowIndex, column });
      });
    });
    this.places = places;
    this.columnWidth = width / Math.max(...rows.map((row) => row.length));
    if (tile.width > this.columnWidth) {
      throw new Error("Tiles must fit in their columns");
    }
  }

  /** Which arrangement this is. */
  public kind(): StageKind {
    return this.arrangement.kind;
  }

  /** The stage's size, in stage units. */
  public size(): Readonly<{ width: number; height: number }> {
    return { width: this.arrangement.width, height: this.arrangement.height };
  }

  /** Every station, row by row. */
  public stations(): readonly AgentStationId[] {
    return this.arrangement.rows.flat();
  }

  /** Where the agent stands to use `station`: in the lane, over the middle of its tile. */
  public spot(station: AgentStationId): Point {
    const { row, column } = this.placeOf(station);
    return { x: this.centreOf(column), y: this.arrangement.lanes[row] };
  }

  /** The tile drawn for `station`. */
  public tile(station: AgentStationId): Rect {
    const { row, column } = this.placeOf(station);
    const { tile, tileTops } = this.arrangement;
    return { x: this.centreOf(column) - tile.width / 2, y: tileTops[row], width: tile.width, height: tile.height };
  }

  /** The floor line of each lane, end to end over its tiles, for the dashed path drawn under the agent. */
  public lanes(): readonly Readonly<{ from: Point; to: Point }>[] {
    return this.arrangement.rows.map((row, index) => ({
      from: { x: this.centreOf(0), y: this.arrangement.lanes[index] },
      to: { x: this.centreOf(row.length - 1), y: this.arrangement.lanes[index] },
    }));
  }

  /** How the agent gets from `from` to `to`: a walk along a lane, or a hop when the row changes. */
  public leg(from: AgentStationId, to: AgentStationId): Leg {
    if (from === to) {
      throw new Error(`A leg needs two different stations, not ${from} twice`);
    }
    const start = this.placeOf(from);
    const end = this.placeOf(to);
    if (start.row !== end.row) {
      const { ms, height } = this.arrangement.hop;
      return new HopLeg(this.spot(from), this.spot(to), ms, height);
    }
    const { baseMs, perColumnMs } = this.arrangement.walk;
    return new WalkLeg(this.spot(from), this.spot(to), baseMs + perColumnMs * Math.abs(end.column - start.column));
  }

  private placeOf(station: AgentStationId): Place {
    const place = this.places.get(station);
    if (place === undefined) {
      throw new Error(`Station ${station} is not on this stage`);
    }
    return place;
  }

  private centreOf(column: number): number {
    return (column + 0.5) * this.columnWidth;
  }
}
