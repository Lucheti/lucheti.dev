import { describe, expect, it } from "vitest";
import { AgentScript, type AgentBeat } from "./AgentScript";

describe("AgentScript", () => {
  const prompt = "Make shot 3 a close-up";
  const script = new AgentScript(prompt.length);

  it("plays typing, sent, calling, result and reply in that order", () => {
    const beats: readonly AgentBeat[] = ["typing", "sent", "calling", "result", "reply"];
    const steps = [0, 1900, 2600, 4200, 5700].map((ms) => script.stepAt(ms));
    expect(steps).toEqual(beats.map((beat) => AgentScript.stepOf(beat)));
    expect(steps).toEqual([0, 1, 2, 3, 4]);
  });

  it("ends a pass on the reply, which is also the resting step", () => {
    expect(script.stepAt(script.duration() - 1)).toBe(AgentScript.finalStep());
    expect(AgentScript.finalStep()).toBe(AgentScript.stepOf("reply"));
  });

  it("starts over after one pass", () => {
    expect(script.stepAt(script.duration())).toBe(AgentScript.stepOf("typing"));
    expect(script.typedAt(script.duration())).toBe(0);
  });

  it("types the prompt out during the typing beat, finishing before it ends", () => {
    expect(script.typedAt(0)).toBe(0);
    expect(script.typedAt(300)).toBeGreaterThan(0);
    expect(script.typedAt(300)).toBeLessThan(prompt.length);
    expect(script.typedAt(1500)).toBe(prompt.length);
    expect(script.typedAt(1799)).toBe(prompt.length);
  });

  it("never types backwards", () => {
    let previous = 0;
    for (let ms = 0; ms < 1800; ms += 50) {
      const typed = script.typedAt(ms);
      expect(typed).toBeGreaterThanOrEqual(previous);
      previous = typed;
    }
  });

  it("clears the composer once the prompt is sent", () => {
    expect(script.typedAt(1900)).toBe(0);
    expect(script.typedAt(5000)).toBe(0);
  });

  it("refuses an empty prompt", () => {
    expect(() => new AgentScript(0)).toThrow();
    expect(() => new AgentScript(2.5)).toThrow();
  });
});
