import { describe, expect, it } from "vitest";
import { lampLit, lookOf } from "./ServiceLook";

describe("lookOf", () => {
  it("keeps a healthy machine humming under a green light", () => {
    const look = lookOf("healthy");
    expect(look.lamp).toBe("green");
    expect(look.hum).toBeGreaterThan(0);
    expect(look.shake).toBe(0);
    expect(look.screen).toBe("count");
  });

  it("makes a busy machine go amber, rattle and burn its fuse", () => {
    const look = lookOf("busy");
    expect(look).toMatchObject({ lamp: "amber", fuse: true, screen: "count" });
    expect(look.shake).toBeGreaterThan(0);
  });

  it("slumps a machine that is down under a red light, smoking", () => {
    const look = lookOf("down");
    expect(look).toMatchObject({ lamp: "red", smoke: true, screen: "down", fuse: false });
    expect(look.slump).toBeGreaterThan(0);
  });

  it("stands a restarting machine back up, blinking, with a spinner", () => {
    const look = lookOf("restarting");
    expect(look).toMatchObject({ lamp: "green", screen: "spinner", slump: 0, smoke: false });
    expect(look.blink).toBeGreaterThan(0);
  });
});

describe("lampLit", () => {
  it("holds a steady lamp lit", () => {
    expect(lampLit(0, 0.37)).toBe(true);
  });

  it("blinks on for the first half of each beat", () => {
    expect(lampLit(2, 0.1)).toBe(true);
    expect(lampLit(2, 0.3)).toBe(false);
    expect(lampLit(2, 0.55)).toBe(true);
  });
});
