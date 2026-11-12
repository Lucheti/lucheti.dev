import { serviceNode, type NodeId } from "./SagaSequencer";

export type Orientation = "horizontal" | "vertical";

/** A position as a fraction (0..1) of the diagram's width and height. */
export type Point = Readonly<{ x: number; y: number }>;

export type MutablePoint = { x: number; y: number };

/** Where a node's card sits relative to its anchor on the wires. */
export type CardPlacement = "centered" | "hanging" | "beside";

/** A polyline the token can be located along. */
export class Route {
  private constructor(
    private readonly points: readonly Point[],
    private readonly cumulative: readonly number[],
  ) {}

  public static through(points: readonly Point[]): Route {
    if (points.length < 2) {
      throw new Error("A route needs at least two points.");
    }
    const cumulative = [0];
    for (let index = 1; index < points.length; index += 1) {
      const previous = points[index - 1];
      const current = points[index];
      cumulative.push(cumulative[index - 1] + Math.hypot(current.x - previous.x, current.y - previous.y));
    }
    return new Route(points, cumulative);
  }

  public get length(): number {
    return this.cumulative[this.cumulative.length - 1];
  }

  public get waypoints(): readonly Point[] {
    return this.points;
  }

  public reversed(): Route {
    return Route.through([...this.points].reverse());
  }

  /** Writes the point at `fraction` of the way along into `out`; allocates nothing. */
  public locate(fraction: number, out: MutablePoint): void {
    const clamped = Math.min(1, Math.max(0, fraction));
    const distance = clamped * this.length;
    let leg = 1;
    while (leg < this.cumulative.length - 1 && this.cumulative[leg] < distance) {
      leg += 1;
    }
    const from = this.points[leg - 1];
    const to = this.points[leg];
    const span = this.cumulative[leg] - this.cumulative[leg - 1];
    const local = span === 0 ? 0 : (distance - this.cumulative[leg - 1]) / span;
    out.x = from.x + (to.x - from.x) * local;
    out.y = from.y + (to.y - from.y) * local;
  }
}

const HORIZONTAL_HEIGHT_PX = 400;
const VERTICAL_ROW_PX = 88;
const TOP_ROW_Y = 0.14;
const ELBOW_Y = 0.3;
const BUS_Y = 0.5;
const FIRST_X = 0.1;
const LAST_X = 0.9;
const GATEWAY_X = 0.3;
const VERTICAL_X = 0.07;
const BUS_OVERHANG = 0.08;

/**
 * Where everything sits in the diagram, in fractions of its box, for one orientation.
 * Horizontal: client and gateway on a top row, the bus below it with the orchestrator
 * at its left end and one service per step along it. Vertical: one line, top to bottom.
 */
export class DiagramLayout {
  private readonly routes = new Map<string, Route>();

  private constructor(
    private readonly orientation: Orientation,
    private readonly stepCount: number,
    private readonly points: ReadonlyMap<NodeId, Point>,
  ) {}

  public static create(orientation: Orientation, stepCount: number): DiagramLayout {
    if (!Number.isInteger(stepCount) || stepCount < 1) {
      throw new Error("A layout needs at least one step.");
    }
    const points = new Map<NodeId, Point>();
    if (orientation === "horizontal") {
      points.set("client", { x: FIRST_X, y: TOP_ROW_Y });
      points.set("gateway", { x: GATEWAY_X, y: TOP_ROW_Y });
      points.set("orchestrator", { x: FIRST_X, y: BUS_Y });
      const pitch = (LAST_X - FIRST_X) / stepCount;
      for (let index = 0; index < stepCount; index += 1) {
        points.set(serviceNode(index), { x: FIRST_X + pitch * (index + 1), y: BUS_Y });
      }
    } else {
      const rows = stepCount + 3;
      const order: readonly NodeId[] = [
        "client",
        "gateway",
        "orchestrator",
        ...Array.from({ length: stepCount }, (_, index) => serviceNode(index)),
      ];
      order.forEach((id, row) => points.set(id, { x: VERTICAL_X, y: (row + 0.5) / rows }));
    }
    return new DiagramLayout(orientation, stepCount, points);
  }

  public get heightPx(): number {
    return this.orientation === "horizontal" ? HORIZONTAL_HEIGHT_PX : (this.stepCount + 3) * VERTICAL_ROW_PX;
  }

  /** Width of one service column as a fraction of the diagram (horizontal only). */
  public get columnWidth(): number {
    return (LAST_X - FIRST_X) / this.stepCount;
  }

  public point(id: NodeId): Point {
    const found = this.points.get(id);
    if (found === undefined) {
      throw new Error(`Unknown node ${id}.`);
    }
    return found;
  }

  public placement(id: NodeId): CardPlacement {
    if (this.orientation === "vertical") {
      return "beside";
    }
    return id === "client" || id === "gateway" ? "centered" : "hanging";
  }

  /** The bus itself: orchestrator to past the last service, overhanging both ends slightly. */
  public bus(): readonly Point[] {
    const last = this.point(serviceNode(this.stepCount - 1));
    const orchestrator = this.point("orchestrator");
    if (this.orientation === "horizontal") {
      return [{ x: orchestrator.x - BUS_OVERHANG, y: BUS_Y }, { x: Math.min(1, last.x + BUS_OVERHANG), y: BUS_Y }];
    }
    return [orchestrator, { x: last.x, y: last.y + 0.5 / (this.stepCount + 3) }];
  }

  /** The static wires drawn before the bus: client, gateway and the path down to the orchestrator. */
  public edgeWires(): readonly (readonly Point[])[] {
    const wires = [this.route("client", "gateway").waypoints, this.route("gateway", "orchestrator").waypoints];
    return wires;
  }

  /** Where the bus label sits. */
  public busLabelPoint(): Point {
    if (this.orientation === "horizontal") {
      return { x: (FIRST_X + this.point(serviceNode(0)).x) / 2, y: BUS_Y };
    }
    const orchestrator = this.point("orchestrator");
    const first = this.point(serviceNode(0));
    return { x: orchestrator.x, y: (orchestrator.y + first.y) / 2 };
  }

  /** The path a token takes between two neighbouring nodes, in either direction. */
  public route(from: NodeId, to: NodeId): Route {
    const key = `${from}>${to}`;
    const cached = this.routes.get(key);
    if (cached !== undefined) {
      return cached;
    }
    const direct = this.canonical(from, to);
    const route = direct ?? this.canonical(to, from)?.reversed();
    if (route === undefined) {
      throw new Error(`No route from ${from} to ${to}.`);
    }
    this.routes.set(key, route);
    return route;
  }

  private canonical(from: NodeId, to: NodeId): Route | undefined {
    const start = this.point(from);
    const end = this.point(to);
    if (from === "client" && to === "gateway") {
      return Route.through([start, end]);
    }
    if (from === "gateway" && to === "orchestrator") {
      if (this.orientation === "vertical") {
        return Route.through([start, end]);
      }
      return Route.through([start, { x: start.x, y: ELBOW_Y }, { x: end.x, y: ELBOW_Y }, end]);
    }
    if (from === "orchestrator" && to.startsWith("service:")) {
      return Route.through([start, end]);
    }
    return undefined;
  }
}
