import { describe, expect, it } from "vitest";
import type { Point3, Solid } from "./kit";
import { OfficeLayout } from "./OfficeLayout";

const layout = new OfficeLayout();

function inside(at: Point3): boolean {
  const { min, max } = layout.extent();
  return at.x >= min.x && at.x <= max.x && at.y >= min.y && at.y <= max.y && at.z >= min.z && at.z <= max.z;
}

function centreOf(solid: Solid): Point3 {
  return solid.kind === "rod" ? solid.from : solid.at;
}

describe("OfficeLayout", () => {
  it("keeps every still solid, prop, ticket spot and label on the island", () => {
    const props = layout.props();
    const solids = [
      ...layout.statics(),
      ...layout.button().housing,
      ...layout.button().cap.solids,
      ...props.stamp.solids,
      ...props.magnifier.solids,
      ...props.lamps.flatMap((lamp) => lamp.solids),
      ...props.rocket.solids,
    ];
    for (const solid of solids) {
      expect(inside(centreOf(solid))).toBe(true);
    }
    const spots = layout.spots();
    for (const spot of [spots.inbox, spots.product, spots.design, spots.hub, spots.qa, spots.rocket, ...spots.desks]) {
      expect(inside(spot)).toBe(true);
    }
    for (const label of layout.labels().values()) {
      expect(inside(label)).toBe(true);
    }
    for (const robot of layout.robots()) {
      expect(inside(robot.at)).toBe(true);
    }
  });

  it("staffs the five departments, with three engineers", () => {
    const count = (station: string): number => layout.robots().filter((robot) => robot.station === station).length;
    expect([count("product"), count("design"), count("engineering"), count("qa"), count("release")]).toEqual([1, 1, 3, 1, 1]);
    expect(layout.spots().desks).toHaveLength(3);
    expect(layout.props().screens).toHaveLength(3);
  });

  it("reads left to right: Product, Design, Engineering, QA, then Release's rocket", () => {
    const spots = layout.spots();
    const order = [spots.product.x, spots.design.x, spots.hub.x, spots.qa.x, spots.rocket.x];
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(layout.button().cap.pivot.x).toBeLessThan(spots.product.x);
  });

  it("gives every robot an orange-tipped antenna and a screen face with eyes", () => {
    for (const robot of layout.robots()) {
      expect(robot.head.solids.some((solid) => solid.tone === "signal" && solid.kind === "ball")).toBe(true);
      expect(robot.head.solids.some((solid) => solid.tone === "screen")).toBe(true);
      expect(robot.eyes.solids.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("frames the rocket at the top of its climb", () => {
    const low = Math.max(...layout.silhouette(0).map((at) => at.y));
    const high = Math.max(...layout.silhouette(1.4).map((at) => at.y));
    expect(high).toBeGreaterThan(low);
  });
});
