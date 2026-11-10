import { Quaternion } from "three";
import { describe, expect, it } from "vitest";
import { AssemblyChoreography, type FrameInput } from "./AssemblyChoreography";
import { ShardField } from "./ShardField";

const field = new ShardField();
const choreography = new AssemblyChoreography(field);

function at(assembly: number, overrides: Partial<FrameInput> = {}): FrameInput {
  return { assembly, time: 0, pointerX: 0, pointerY: 0, liveliness: 1, ...overrides };
}

describe("AssemblyChoreography", () => {
  it("puts every shard exactly home, unrotated and still, at assembly 1", () => {
    const poses = choreography.allocate();
    poses.forEach((pose, i) => {
      choreography.place(i, at(1, { time: 12.3, pointerX: 0.7, pointerY: -0.4 }), pose);
      expect(pose.position.distanceTo(field.shard(i).home)).toBe(0);
      expect(pose.quaternion.angleTo(new Quaternion())).toBeCloseTo(0, 12);
    });
  });

  it("pushes every shard at least 1.2 radii out at assembly 0", () => {
    const poses = choreography.allocate();
    poses.forEach((pose, i) => {
      choreography.place(i, at(0, { time: 5 }), pose);
      expect(pose.position.length()).toBeGreaterThanOrEqual(1.2);
    });
  });

  it("is still when assembled and drifting when scattered", () => {
    const [a, b] = choreography.allocate();
    choreography.place(0, at(1, { time: 1 }), a);
    choreography.place(0, at(1, { time: 9 }), b);
    expect(a.position.distanceTo(b.position)).toBe(0);

    choreography.place(0, at(0, { time: 1 }), a);
    choreography.place(0, at(0, { time: 9 }), b);
    expect(a.position.distanceTo(b.position)).toBeGreaterThan(0);
  });

  it("does not drift under reduced motion", () => {
    const [a, b] = choreography.allocate();
    choreography.place(0, at(0, { time: 1, liveliness: 0 }), a);
    choreography.place(0, at(0, { time: 9, liveliness: 0 }), b);
    expect(a.position.distanceTo(b.position)).toBe(0);
  });

  it("brings shards home in sequence, not together", () => {
    const shards = Array.from({ length: 20 }, (_, i) => field.shard(i));
    const early = shards.reduce((x, y) => (y.windowStart < x.windowStart ? y : x));
    const late = shards.reduce((x, y) => (y.windowStart > x.windowStart ? y : x));
    const assembly = 0.5;
    expect(AssemblyChoreography.arrival(assembly, early.windowStart)).toBeGreaterThan(
      AssemblyChoreography.arrival(assembly, late.windowStart),
    );
  });
});
