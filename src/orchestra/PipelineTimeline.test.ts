import { describe, expect, it } from "vitest";
import { PipelineTimeline } from "./PipelineTimeline";

const timeline = new PipelineTimeline({ principles: 3, stages: 7, logLines: 8 });

describe("PipelineTimeline", () => {
  it("shows nothing at the start", () => {
    expect(timeline.stateAt(0)).toEqual({ principles: 0, statsShown: false, litStages: 0, logLines: 0 });
  });

  it("reveals principles at 0.2, 0.35 and 0.5", () => {
    expect(timeline.stateAt(0.19).principles).toBe(0);
    expect(timeline.stateAt(0.2).principles).toBe(1);
    expect(timeline.stateAt(0.34).principles).toBe(1);
    expect(timeline.stateAt(0.35).principles).toBe(2);
    expect(timeline.stateAt(0.5).principles).toBe(3);
    expect(timeline.stateAt(1).principles).toBe(3);
  });

  it("shows the stats from 0.55", () => {
    expect(timeline.stateAt(0.54).statsShown).toBe(false);
    expect(timeline.stateAt(0.55).statsShown).toBe(true);
  });

  it("moves the ticket from the first to the last stage between 0.15 and 0.95", () => {
    expect(timeline.tokenAt(0)).toBe(0);
    expect(timeline.tokenAt(0.15)).toBe(0);
    expect(timeline.tokenAt(0.55)).toBeCloseTo(0.5);
    expect(timeline.tokenAt(0.95)).toBe(1);
    expect(timeline.tokenAt(1)).toBe(1);
  });

  it("lights each stage as the ticket reaches it", () => {
    expect(timeline.stateAt(0.14).litStages).toBe(0);
    expect(timeline.stateAt(0.15).litStages).toBe(1);
    expect(timeline.stateAt(0.55).litStages).toBe(4);
    expect(timeline.stateAt(0.949).litStages).toBe(6);
    expect(timeline.stateAt(0.95).litStages).toBe(7);
  });

  it("reveals log lines at evenly spaced thresholds and all by the end", () => {
    expect(timeline.stateAt(0.29).logLines).toBe(0);
    expect(timeline.stateAt(0.3).logLines).toBe(1);
    const counts = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((p) => timeline.stateAt(p).logLines);
    expect(counts).toEqual([...counts].sort((a, b) => a - b));
    expect(timeline.stateAt(1).logLines).toBe(8);
  });

  it("is reversible: the state depends only on progress", () => {
    const forward = timeline.stateAt(0.6);
    timeline.stateAt(1);
    expect(timeline.stateAt(0.6)).toEqual(forward);
  });

  it("rejects a pipeline with fewer than two stages", () => {
    expect(() => new PipelineTimeline({ principles: 3, stages: 1, logLines: 2 })).toThrow(RangeError);
  });

  it("compares states by value", () => {
    expect(PipelineTimeline.same(timeline.stateAt(0.6), timeline.stateAt(0.6))).toBe(true);
    expect(PipelineTimeline.same(timeline.stateAt(0.6), timeline.stateAt(0.2))).toBe(false);
  });
});
