import { describe, expect, it } from "vitest";
import type { Department, DepartmentId, OrchestraStep } from "@/content";
import { BoardGeometry, type Box } from "./BoardGeometry";
import { LifecycleScript } from "./LifecycleScript";
import { PacketTrack } from "./PacketTrack";
import type { PointSlot } from "./Polyline";
import { Roster } from "./Roster";

const departments: readonly Department[] = [
  { id: "product", name: "Product", agents: ["head-of-product"] },
  { id: "engineering", name: "Engineering", agents: ["engineer"] },
];

/** Windows of 0.4: step 1 hands off from 0.55 to 0.75, then holds. */
const steps: readonly OrchestraStep[] = [
  { department: "product", workers: ["head-of-product"], ticket: "F-1", message: "accepted" },
  { department: "engineering", workers: ["engineer"], ticket: "C-1", message: "build" },
];

const geometry = new BoardGeometry(
  new Map<DepartmentId, Box>([
    ["product", { x: 0, y: 0, width: 200, height: 100 }],
    ["engineering", { x: 240, y: 0, width: 200, height: 100 }],
  ]),
);
const track = new PacketTrack(new LifecycleScript(steps, Roster.of(departments, steps), 0), geometry);
const out: PointSlot = { x: 0, y: 0 };

describe("PacketTrack", () => {
  it("has no packet before the first step", () => {
    expect(track.place(0.1, out)).toBe(false);
  });

  it("rests on the first department's dock", () => {
    expect(track.place(0.3, out)).toBe(true);
    expect(out).toEqual({ x: 156, y: 0 });
  });

  it("travels the handoff route with scroll, and back again", () => {
    // Route: (156,0) → (200,0) → (200,50) → (240,50) → (240,0) → (396,0); 44 + 50 + 40 + 50 + 156 = 340.
    track.place(0.55 + 0.2 * (94 / 340), out);
    expect(out.x).toBeCloseTo(200);
    expect(out.y).toBeCloseTo(50);
    track.place(0.55, out);
    expect(out.x).toBeCloseTo(156);
    expect(out.y).toBeCloseTo(0);
  });

  it("docks on the receiver once delivered", () => {
    track.place(1, out);
    expect(out).toEqual({ x: 396, y: 0 });
  });
});
