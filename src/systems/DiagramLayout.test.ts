import { describe, expect, it } from "vitest";
import { DiagramLayout, Route, type MutablePoint, type NodeBox, type Orientation } from "./DiagramLayout";
import { serviceIndex, serviceNode, type NodeId } from "./SagaSequencer";

describe("Route", () => {
  const route = Route.through([
    { x: 0, y: 0 },
    { x: 0.5, y: 0 },
    { x: 0.5, y: 0.5 },
  ]);

  it("measures its length", () => {
    expect(route.length).toBeCloseTo(1);
  });

  it("locates points along a bend", () => {
    const out: MutablePoint = { x: 0, y: 0 };
    route.locate(0, out);
    expect(out).toEqual({ x: 0, y: 0 });
    route.locate(0.25, out);
    expect(out.x).toBeCloseTo(0.25);
    expect(out.y).toBeCloseTo(0);
    route.locate(0.75, out);
    expect(out.x).toBeCloseTo(0.5);
    expect(out.y).toBeCloseTo(0.25);
    route.locate(1, out);
    expect(out).toEqual({ x: 0.5, y: 0.5 });
  });

  it("clamps the fraction and reverses", () => {
    const out: MutablePoint = { x: 0, y: 0 };
    route.reversed().locate(5, out);
    expect(out).toEqual({ x: 0, y: 0 });
  });

  it("needs two points", () => {
    expect(() => Route.through([{ x: 0, y: 0 }])).toThrow();
  });
});

function overlaps(a: NodeBox, b: NodeBox): boolean {
  return Math.abs(a.x - b.x) * 2 < a.width + b.width && Math.abs(a.y - b.y) * 2 < a.height + b.height;
}

function allNodes(stepCount: number): readonly NodeId[] {
  return ["client", "gateway", "orchestrator", ...Array.from({ length: stepCount }, (_, index) => serviceNode(index))];
}

describe.each<Orientation>(["wide", "narrow"])("DiagramLayout %s", (orientation) => {
  const layout = DiagramLayout.create(orientation, 4);

  it("keeps every node inside the box without overlaps", () => {
    const ids = allNodes(4);
    for (const id of ids) {
      const box = layout.box(id);
      expect(box.x - box.width / 2).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width / 2).toBeLessThanOrEqual(1);
      expect(box.y - box.height / 2).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height / 2).toBeLessThanOrEqual(1);
    }
    for (let first = 0; first < ids.length; first += 1) {
      for (let second = first + 1; second < ids.length; second += 1) {
        expect(overlaps(layout.box(ids[first]), layout.box(ids[second]))).toBe(false);
      }
    }
  });

  it("places the services at the diagonals, clockwise from top-left, around the hub", () => {
    const hub = layout.point("orchestrator");
    const signs = [0, 1, 2, 3].map((index) => {
      const point = layout.point(serviceNode(index));
      return [Math.sign(point.x - hub.x), Math.sign(point.y - hub.y)];
    });
    expect(signs).toEqual([
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]);
  });

  it("has the hub inside the ring and every service outside it", () => {
    const { cx, cy, radius } = layout.ring;
    const hub = layout.box("orchestrator");
    const halfDiagonal = Math.hypot((hub.width * layout.width) / 2, (hub.height * layout.height) / 2);
    expect(halfDiagonal).toBeLessThan(radius);
    for (let index = 0; index < 4; index += 1) {
      const centre = layout.toUnits(layout.point(serviceNode(index)));
      expect(Math.hypot(centre.x - cx, centre.y - cy)).toBeGreaterThan(radius);
    }
  });

  it("draws every spoke across the ring", () => {
    const { cx, cy, radius } = layout.ring;
    for (const spoke of layout.spokes()) {
      const [start, end] = spoke.map((point) => layout.toUnits(point));
      expect(Math.hypot(start.x - cx, start.y - cy)).toBeLessThan(radius);
      expect(Math.hypot(end.x - cx, end.y - cy)).toBeGreaterThan(radius);
    }
  });

  it("starts routes on the first node's edge and ends on the second's, in both directions", () => {
    const out: MutablePoint = { x: 0, y: 0 };
    const target = serviceNode(2);
    const forward = layout.route("orchestrator", target);
    const back = layout.route(target, "orchestrator");
    forward.locate(0, out);
    const start = { ...out };
    forward.locate(1, out);
    const end = { ...out };
    back.locate(0, out);
    expect(out.x).toBeCloseTo(end.x);
    expect(out.y).toBeCloseTo(end.y);
    back.locate(1, out);
    expect(out.x).toBeCloseTo(start.x);
    expect(out.y).toBeCloseTo(start.y);
  });

  it("leaves the hub on the side that faces the service", () => {
    const hub = layout.point("orchestrator");
    const out: MutablePoint = { x: 0, y: 0 };
    layout.route("orchestrator", serviceNode(0)).locate(0, out);
    expect(out.x).toBeLessThan(hub.x);
    expect(out.y).toBeLessThanOrEqual(hub.y);
  });

  it("rejects nodes that are not neighbours", () => {
    expect(() => layout.route("client", serviceNode(0))).toThrow();
    expect(() => layout.point(serviceNode(9))).toThrow();
  });

  it("labels the edge on its wire and the ring below the hub", () => {
    expect(layout.ringLabelPoint().y).toBeGreaterThan(layout.point("orchestrator").y);
    expect(layout.edgeLabelPoint().x).toBeGreaterThanOrEqual(0);
  });
});

describe("DiagramLayout orientations", () => {
  it("feeds the hub from the left when wide", () => {
    const layout = DiagramLayout.create("wide", 4);
    expect(layout.point("client").x).toBeLessThan(layout.point("gateway").x);
    expect(layout.point("gateway").x).toBeLessThan(layout.point("orchestrator").x);
    expect(layout.point("gateway").y).toBeCloseTo(layout.point("orchestrator").y);
    expect(layout.width).toBeGreaterThan(layout.height);
  });

  it("stacks client, gateway and hub when narrow, and fits 375px", () => {
    const layout = DiagramLayout.create("narrow", 4);
    expect(layout.point("client").y).toBeLessThan(layout.point("gateway").y);
    expect(layout.point("gateway").y).toBeLessThan(layout.point("orchestrator").y);
    expect(layout.point("gateway").x).toBeCloseTo(layout.point("orchestrator").x);
    expect(layout.width).toBeLessThanOrEqual(343);
  });

  it("rejects a layout without steps", () => {
    expect(() => DiagramLayout.create("wide", 0)).toThrow();
  });
});

describe("serviceIndex", () => {
  it("reads the step of a service node only", () => {
    expect(serviceIndex(serviceNode(3))).toBe(3);
    expect(serviceIndex("orchestrator")).toBeNull();
  });
});
