import { describe, expect, it } from "vitest";
import { DiagramLayout, Route, type MutablePoint } from "./DiagramLayout";
import { serviceNode } from "./SagaSequencer";

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

describe("DiagramLayout horizontal", () => {
  const layout = DiagramLayout.create("horizontal", 4);

  it("puts the orchestrator at the bus start and services left to right", () => {
    const xs = [0, 1, 2, 3].map((index) => layout.point(serviceNode(index)).x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    expect(layout.point("orchestrator").x).toBeLessThan(xs[0]);
    expect(layout.point("orchestrator").y).toBe(layout.point(serviceNode(0)).y);
  });

  it("keeps every service on the bus line and inside the box", () => {
    for (let index = 0; index < 4; index += 1) {
      const point = layout.point(serviceNode(index));
      expect(point.y).toBe(layout.point("orchestrator").y);
      expect(point.x).toBeLessThanOrEqual(1);
    }
  });

  it("starts routes at the first node and ends at the second, in both directions", () => {
    const out: MutablePoint = { x: 0, y: 0 };
    const target = serviceNode(2);
    layout.route("orchestrator", target).locate(1, out);
    expect(out.x).toBeCloseTo(layout.point(target).x);
    expect(out.y).toBeCloseTo(layout.point(target).y);
    layout.route(target, "orchestrator").locate(1, out);
    expect(out.x).toBeCloseTo(layout.point("orchestrator").x);
    expect(out.y).toBeCloseTo(layout.point("orchestrator").y);
  });

  it("routes the gateway down to the orchestrator through an elbow", () => {
    expect(layout.route("gateway", "orchestrator").waypoints).toHaveLength(4);
  });

  it("rejects nodes that are not neighbours", () => {
    expect(() => layout.route("client", serviceNode(0))).toThrow();
    expect(() => layout.point(serviceNode(9))).toThrow();
  });

  it("places edge cards centred on their point and bus cards hanging below it", () => {
    expect(layout.placement("client")).toBe("centered");
    expect(layout.placement("orchestrator")).toBe("hanging");
    expect(layout.placement(serviceNode(1))).toBe("hanging");
  });
});

describe("DiagramLayout vertical", () => {
  const layout = DiagramLayout.create("vertical", 4);

  it("stacks every node on one vertical line, top to bottom", () => {
    const ids = ["client", "gateway", "orchestrator", serviceNode(0), serviceNode(1), serviceNode(2), serviceNode(3)] as const;
    const points = ids.map((id) => layout.point(id));
    expect(new Set(points.map((point) => point.x)).size).toBe(1);
    expect(points.map((point) => point.y)).toEqual([...points.map((point) => point.y)].sort((a, b) => a - b));
  });

  it("grows with the number of steps", () => {
    expect(DiagramLayout.create("vertical", 5).heightPx).toBeGreaterThan(layout.heightPx);
    expect(layout.placement("gateway")).toBe("beside");
  });

  it("rejects a layout without steps", () => {
    expect(() => DiagramLayout.create("vertical", 0)).toThrow();
  });
});
