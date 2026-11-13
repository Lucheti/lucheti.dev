import { serviceNode, type NodeId } from "./SagaSequencer";

/** `wide` puts the gateway to the left of the hub; `narrow` stacks it above. */
export type Orientation = "wide" | "narrow";

/** A position as a fraction (0..1) of the diagram's width and height. */
export type Point = Readonly<{ x: number; y: number }>;

export type MutablePoint = { x: number; y: number };

/** A node's footprint as fractions of the diagram: its centre and full size. */
export type NodeBox = Readonly<{ x: number; y: number; width: number; height: number }>;

/** The NATS ring in layout units (the diagram is `width` × `height` units). */
export type Ring = Readonly<{ cx: number; cy: number; radius: number }>;

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

/** A node's centre and half extents, in layout units. */
type Footprint = Readonly<{ cx: number; cy: number; halfWidth: number; halfHeight: number }>;

type Size = Readonly<{ halfWidth: number; halfHeight: number }>;

type Blueprint = Readonly<{
  width: number;
  height: number;
  client: Readonly<{ cx: number; cy: number }> & Size;
  gateway: Readonly<{ cx: number; cy: number }> & Size;
  hub: Readonly<{ cx: number; cy: number }> & Size;
  service: Size;
  /** Offset of the diagonal services from the hub centre. */
  serviceOffset: Readonly<{ dx: number; dy: number }>;
  ringRadius: number;
}>;

const BLUEPRINTS: Readonly<Record<Orientation, Blueprint>> = {
  wide: {
    width: 1000,
    height: 520,
    client: { cx: 65, cy: 260, halfWidth: 46, halfHeight: 20 },
    gateway: { cx: 250, cy: 260, halfWidth: 88, halfHeight: 20 },
    hub: { cx: 600, cy: 260, halfWidth: 90, halfHeight: 40 },
    service: { halfWidth: 84, halfHeight: 32 },
    serviceOffset: { dx: 230, dy: 185 },
    ringRadius: 135,
  },
  narrow: {
    width: 340,
    height: 500,
    client: { cx: 170, cy: 26, halfWidth: 50, halfHeight: 18 },
    gateway: { cx: 170, cy: 92, halfWidth: 84, halfHeight: 20 },
    hub: { cx: 170, cy: 300, halfWidth: 75, halfHeight: 36 },
    service: { halfWidth: 65, halfHeight: 28 },
    serviceOffset: { dx: 95, dy: 130 },
    ringRadius: 100,
  },
};

/** The first service sits at the top-left; the rest follow clockwise. */
const FIRST_ANGLE = -Math.PI * 0.75;
const DIAGONAL = Math.SQRT1_2;

/** Where the line from a footprint's centre toward `target` leaves its rectangle. */
function edgePoint(from: Footprint, target: Footprint): Point {
  const dx = target.cx - from.cx;
  const dy = target.cy - from.cy;
  const scaleX = dx === 0 ? Number.POSITIVE_INFINITY : from.halfWidth / Math.abs(dx);
  const scaleY = dy === 0 ? Number.POSITIVE_INFINITY : from.halfHeight / Math.abs(dy);
  const scale = Math.min(scaleX, scaleY);
  return { x: from.cx + dx * scale, y: from.cy + dy * scale };
}

/**
 * Where everything sits in the diagram, for one orientation: the orchestrator is the hub in
 * the middle of a NATS ring, the services sit around it joined by spokes, and the client
 * and gateway feed the hub from the left (wide) or from above (narrow).
 * Positions are exposed as fractions of the box so the view can place them with percentages;
 * the box keeps a fixed aspect ratio so the ring stays a circle.
 */
export class DiagramLayout {
  private readonly routes = new Map<string, Route>();

  private constructor(
    private readonly blueprint: Blueprint,
    private readonly stepCount: number,
    private readonly footprints: ReadonlyMap<NodeId, Footprint>,
  ) {}

  public static create(orientation: Orientation, stepCount: number): DiagramLayout {
    if (!Number.isInteger(stepCount) || stepCount < 1) {
      throw new Error("A layout needs at least one step.");
    }
    const blueprint = BLUEPRINTS[orientation];
    const footprints = new Map<NodeId, Footprint>();
    footprints.set("client", blueprint.client);
    footprints.set("gateway", blueprint.gateway);
    footprints.set("orchestrator", blueprint.hub);
    for (let index = 0; index < stepCount; index += 1) {
      const angle = FIRST_ANGLE + (index * 2 * Math.PI) / stepCount;
      footprints.set(serviceNode(index), {
        cx: blueprint.hub.cx + (blueprint.serviceOffset.dx / DIAGONAL) * Math.cos(angle),
        cy: blueprint.hub.cy + (blueprint.serviceOffset.dy / DIAGONAL) * Math.sin(angle),
        ...blueprint.service,
      });
    }
    return new DiagramLayout(blueprint, stepCount, footprints);
  }

  /** Width and height of the layout units; also the SVG viewBox. */
  public get width(): number {
    return this.blueprint.width;
  }

  public get height(): number {
    return this.blueprint.height;
  }

  public get ring(): Ring {
    const { hub, ringRadius } = this.blueprint;
    return { cx: hub.cx, cy: hub.cy, radius: ringRadius };
  }

  public toUnits(point: Point): Point {
    return { x: point.x * this.width, y: point.y * this.height };
  }

  public point(id: NodeId): Point {
    const footprint = this.footprint(id);
    return { x: footprint.cx / this.width, y: footprint.cy / this.height };
  }

  public box(id: NodeId): NodeBox {
    const footprint = this.footprint(id);
    return {
      x: footprint.cx / this.width,
      y: footprint.cy / this.height,
      width: (footprint.halfWidth * 2) / this.width,
      height: (footprint.halfHeight * 2) / this.height,
    };
  }

  /** The static wires of the edge: client to gateway, gateway to the hub. */
  public edgeWires(): readonly (readonly Point[])[] {
    return [this.route("client", "gateway").waypoints, this.route("gateway", "orchestrator").waypoints];
  }

  /** One wire per service, from the hub's edge to the service's edge. */
  public spokes(): readonly (readonly Point[])[] {
    return Array.from({ length: this.stepCount }, (_, index) => this.route("orchestrator", serviceNode(index)).waypoints);
  }

  /** Where the HTTP label sits: halfway along the client wire. */
  public edgeLabelPoint(): Point {
    const waypoints = this.route("client", "gateway").waypoints;
    return { x: (waypoints[0].x + waypoints[1].x) / 2, y: (waypoints[0].y + waypoints[1].y) / 2 };
  }

  /** Where the ring's label sits: the bottom of the ring, clear of the incoming edge. */
  public ringLabelPoint(): Point {
    const { cx, cy, radius } = this.ring;
    return { x: cx / this.width, y: (cy + radius) / this.height };
  }

  /** The path a token takes between two neighbouring nodes, in either direction. */
  public route(from: NodeId, to: NodeId): Route {
    const key = `${from}>${to}`;
    const cached = this.routes.get(key);
    if (cached !== undefined) {
      return cached;
    }
    const route = this.canonical(from, to) ?? this.canonical(to, from)?.reversed();
    if (route === undefined) {
      throw new Error(`No route from ${from} to ${to}.`);
    }
    this.routes.set(key, route);
    return route;
  }

  private canonical(from: NodeId, to: NodeId): Route | undefined {
    const linked =
      (from === "client" && to === "gateway") ||
      (from === "gateway" && to === "orchestrator") ||
      (from === "orchestrator" && to.startsWith("service:"));
    if (!linked) {
      return undefined;
    }
    const start = this.footprint(from);
    const end = this.footprint(to);
    return Route.through([this.fraction(edgePoint(start, end)), this.fraction(edgePoint(end, start))]);
  }

  private fraction(unit: Point): Point {
    return { x: unit.x / this.width, y: unit.y / this.height };
  }

  private footprint(id: NodeId): Footprint {
    const found = this.footprints.get(id);
    if (found === undefined) {
      throw new Error(`Unknown node ${id}.`);
    }
    return found;
  }
}
