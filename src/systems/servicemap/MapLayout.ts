import { assertNever } from "../queue/assertNever";
import { SERVICES, STORES, type Edge, type EdgeBook, type NodeId, type ServiceId } from "./topology";

/** A box on the canvas, in its pixels from its top left. */
export type Rect = Readonly<{ x: number; y: number; width: number; height: number }>;

/** A point the painter writes into, so placing a dot builds nothing. */
export type PointBuffer = { x: number; y: number };

type Point = Readonly<{ x: number; y: number }>;

/** A cubic curve from `a` to `b` through the control points `c1` and `c2`. */
type Curve = Readonly<{ a: Point; c1: Point; c2: Point; b: Point }>;

/** A card's size, and the canvas's inner edge. */
const CARD = { width: 130, height: 46 } as const;
const PAD = 22;
/** The three columns: clients and gateway, the services, the stores. Gaps between them are equal. */
const COLUMNS = [PAD, PAD + CARD.width + 63, PAD + 2 * (CARD.width + 63)] as const;
/** The rows of services and stores, top to bottom; the gateway sits on the middle one, the clients above. */
const ROWS = [PAD + 40, PAD + 40 + 68, PAD + 40 + 136] as const;

/** Eases a dot along its edge: steady through the middle, a touch slower leaving and arriving. */
export function travel(progress: number): number {
  const t = Math.min(1, Math.max(0, progress));
  return 0.6 * t + 0.4 * t * t * (3 - 2 * t);
}

/**
 * Where everything sits on the service map's canvas: the cards in three columns (clients above the gateway,
 * then the services, then the stores), and each edge as a soft curve from one card's side to the next's, or
 * straight down from the clients to the gateway. Dots are placed along those same curves.
 */
export class MapLayout {
  private readonly curves = new Map<Edge, Curve>();

  public constructor(private readonly edges: EdgeBook) {
    for (const edge of edges.all()) {
      this.curves.set(edge, MapLayout.curveOf(edge, (id) => this.node(id)));
    }
  }

  /** The canvas the map needs. */
  public size(): Readonly<{ width: number; height: number }> {
    return { width: COLUMNS[2] + CARD.width + PAD, height: ROWS[2] + CARD.height + 2 * PAD };
  }

  /** A card's box. */
  public node(id: NodeId): Rect {
    const card = (x: number, y: number): Rect => ({ x, y, ...CARD });
    switch (id) {
      case "clients":
        return card(COLUMNS[0], PAD);
      case "gateway":
        return card(COLUMNS[0], ROWS[1]);
      case "orders":
      case "payments":
      case "inventory":
        return card(COLUMNS[1], ROWS[SERVICES.indexOf(id)]);
      case "postgres":
      case "nats":
      case "redis":
        return card(COLUMNS[2], ROWS[STORES.indexOf(id)]);
      default:
        return assertNever(id);
    }
  }

  /** An edge as an SVG path. */
  public path(edge: Edge): string {
    const { a, c1, c2, b } = this.curve(edge);
    return `M${a.x} ${a.y} C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}`;
  }

  /** The middle of an edge, where its breaker's pill sits. */
  public midpoint(edge: Edge): Point {
    const into: PointBuffer = { x: 0, y: 0 };
    this.place(edge, 0.5, into);
    return into;
  }

  /** Where the legend starts: under the bottom row, in line with the first column. */
  public legendSpot(): Point {
    return { x: COLUMNS[0] + 2, y: ROWS[2] + CARD.height + 20 };
  }

  /** Where the pill for the gateway's breaker on a service's edge sits. */
  public breakerSpot(service: ServiceId): Point {
    return this.midpoint(this.edges.route(service));
  }

  /** Writes the point `t` of the way along `edge` (0 at its start, 1 at its end) into `into`. */
  public place(edge: Edge, t: number, into: PointBuffer): void {
    const { a, c1, c2, b } = this.curve(edge);
    const u = 1 - t;
    const w0 = u * u * u;
    const w1 = 3 * u * u * t;
    const w2 = 3 * u * t * t;
    const w3 = t * t * t;
    into.x = w0 * a.x + w1 * c1.x + w2 * c2.x + w3 * b.x;
    into.y = w0 * a.y + w1 * c1.y + w2 * c2.y + w3 * b.y;
  }

  /** Every edge on the map, in drawing order. */
  public all(): readonly Edge[] {
    return this.edges.all();
  }

  private curve(edge: Edge): Curve {
    const curve = this.curves.get(edge);
    if (curve === undefined) {
      throw new Error(`Not an edge of this map: ${JSON.stringify(edge)}`);
    }
    return curve;
  }

  private static curveOf(edge: Edge, node: (id: NodeId) => Rect): Curve {
    switch (edge.kind) {
      case "entry": {
        const from = node("clients");
        const to = node("gateway");
        const x = from.x + from.width / 2;
        const a = { x, y: from.y + from.height };
        const b = { x, y: to.y };
        return { a, c1: a, c2: b, b };
      }
      case "route":
        return MapLayout.sideways(node("gateway"), node(edge.service));
      case "store":
        return MapLayout.sideways(node(edge.service), node(edge.store));
      default:
        return assertNever(edge);
    }
  }

  /** From the middle of one card's right side to the middle of the next card's left side, as a soft S. */
  private static sideways(from: Rect, to: Rect): Curve {
    const a = { x: from.x + from.width, y: from.y + from.height / 2 };
    const b = { x: to.x, y: to.y + to.height / 2 };
    const reach = (b.x - a.x) / 2;
    return { a, c1: { x: a.x + reach, y: a.y }, c2: { x: b.x - reach, y: b.y }, b };
  }
}
