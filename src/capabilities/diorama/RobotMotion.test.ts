import { describe, expect, it } from "vitest";
import { armsFor, eyesAt, robotPose } from "./RobotMotion";

describe("RobotMotion", () => {
  it("blinks now and then: eyes open most of the time, shut for a beat", () => {
    const samples = Array.from({ length: 1000 }, (_, step) => eyesAt(step * 0.01, 3));
    const shut = samples.filter((open) => open < 1).length;
    expect(shut).toBeGreaterThan(0);
    expect(shut).toBeLessThan(samples.length * 0.1);
  });

  it("gives each robot its own rhythm", () => {
    const blinkTimes = (seed: number): number[] =>
      Array.from({ length: 600 }, (_, step) => step * 0.01).filter((time) => eyesAt(time, seed) < 1);
    expect(blinkTimes(1)).not.toEqual(blinkTimes(2));
  });

  it("raises the arms to the front for work and up high to cheer", () => {
    const rest = armsFor({ kind: "rest" }, 1, 1);
    const typing = armsFor({ kind: "type" }, 1, 1);
    const cheer = armsFor({ kind: "cheer" }, 1, 1);
    expect(Math.abs(rest[0])).toBeLessThan(0.2);
    expect(typing[0]).toBeLessThan(-0.6);
    expect(cheer[1]).toBeLessThan(-2);
    expect(armsFor({ kind: "hold", drop: 1 }, 1, 1)[1]).toBeGreaterThan(armsFor({ kind: "hold", drop: 0 }, 1, 1)[1]);
  });

  it("tips the head down at work, hops when it cheers, and shakes its head at a bug", () => {
    const idle = robotPose(2, 1, "idle", { kind: "rest" });
    const work = robotPose(2, 1, "work", { kind: "type" });
    expect(work.headPitch).toBeGreaterThan(idle.headPitch);
    const hops = Array.from({ length: 50 }, (_, step) => robotPose(step * 0.02, 1, "cheer", { kind: "cheer" }).lift);
    expect(Math.max(...hops)).toBeGreaterThan(0.05);
    const shakes = Array.from({ length: 50 }, (_, step) => robotPose(step * 0.02, 1, "frown", { kind: "rest" }).headYaw);
    expect(Math.max(...shakes) - Math.min(...shakes)).toBeGreaterThan(0.4);
  });
});
