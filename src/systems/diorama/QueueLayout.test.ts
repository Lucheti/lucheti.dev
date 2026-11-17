import { describe, expect, it } from "vitest";
import { QUEUE_CONFIG } from "../queue/queueConfig";
import type { Extent, Point3, Solid } from "./kit";
import { QueueLayout } from "./QueueLayout";

const layout = new QueueLayout();

function inside(extent: Extent, at: Point3): boolean {
  return (
    at.x >= extent.min.x && at.x <= extent.max.x && at.y >= extent.min.y && at.y <= extent.max.y && at.z >= extent.min.z && at.z <= extent.max.z
  );
}

function centreOf(solid: Solid): Point3 {
  return solid.kind === "rod" ? solid.from : solid.at;
}

describe("QueueLayout", () => {
  it("keeps every solid and label on the island", () => {
    const extent = layout.extent();
    const solids = [
      ...layout.statics(),
      ...layout.kiosk().solids,
      ...layout.button().housing,
      ...layout.button().cap.solids,
      layout.glass(),
      ...layout.machines().flatMap((machine) => [...machine.body.solids, ...machine.lamp.solids, ...machine.fuse.solids]),
    ];
    for (const solid of solids) {
      expect(inside(extent, centreOf(solid))).toBe(true);
    }
    for (const label of Object.values(layout.labels())) {
      expect(inside(extent, label)).toBe(true);
    }
  });

  it("gives each machine a tray slot for every message the broker may deal it", () => {
    expect(layout.machines()).toHaveLength(QUEUE_CONFIG.services.length);
    for (const machine of layout.machines()) {
      expect(machine.tray).toHaveLength(QUEUE_CONFIG.broker.capacity);
    }
  });

  it("stacks the hopper's levels inside its glass", () => {
    const hopper = layout.hopper();
    const glass = layout.glass();
    if (glass.kind !== "block") {
      throw new Error("The glass is a box");
    }
    const top = hopper.floor + (hopper.levels - 1) * hopper.pitch + layout.parcel() / 2;
    expect(top).toBeLessThan(glass.at.y + glass.size.y / 2);
    expect(hopper.floor - layout.parcel() / 2).toBeGreaterThanOrEqual(glass.at.y - glass.size.y / 2);
    expect(new Set(hopper.fillOrder).size).toBe(hopper.columns.length);
  });

  it("puts the button in front of the kiosk, its cap above its housing", () => {
    const button = layout.button();
    expect(button.cap.pivot.z).toBeGreaterThan(layout.kiosk().pivot.z);
    expect(button.cap.pivot.y - button.travel).toBeGreaterThan(0.4);
  });
});
