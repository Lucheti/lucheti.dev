import { describe, expect, it } from "vitest";
import { WIDE_STAGE } from "./agentConfig";
import { confettiAt, flyingTicket, HANDS_HEIGHT } from "./shipEffects";
import { StageLayout } from "./StageLayout";

const layout = new StageLayout(WIDE_STAGE);

describe("flyingTicket", () => {
  it("is not drawn while held or gone", () => {
    expect(flyingTicket({ kind: "held" }, layout)).toBeNull();
    expect(flyingTicket({ kind: "none" }, layout)).toBeNull();
  });

  it("rises from the inbox tray into the agent's hands", () => {
    const tray = layout.tile("inbox");
    const start = flyingTicket({ kind: "rising", progress: 0 }, layout);
    const end = flyingTicket({ kind: "rising", progress: 1 }, layout);
    expect(start?.y).toBeGreaterThan(tray.y);
    expect(end?.x).toBeCloseTo(layout.spot("inbox").x, 6);
    expect(end?.y).toBeCloseTo(layout.spot("inbox").y - HANDS_HEIGHT, 6);
    expect(end?.scale).toBe(1);
  });

  it("drops from the hands into Ship, shrinking and fading out", () => {
    const box = layout.tile("ship");
    const start = flyingTicket({ kind: "dropping", progress: 0 }, layout);
    const end = flyingTicket({ kind: "dropping", progress: 1 }, layout);
    expect(start?.opacity).toBe(1);
    expect(end?.y).toBeGreaterThan(box.y);
    expect(end?.scale).toBe(0.5);
    expect(end?.opacity).toBe(0);
  });
});

describe("confettiAt", () => {
  it("starts hidden at the burst point, flies up and out, then fades away", () => {
    const start = confettiAt(0);
    expect(start.every((piece) => piece.x === 0 && piece.y === 0 && piece.opacity === 0)).toBe(true);
    const mid = confettiAt(0.4);
    expect(mid.some((piece) => piece.y < -15)).toBe(true);
    expect(mid.some((piece) => piece.x < -10) && mid.some((piece) => piece.x > 10)).toBe(true);
    expect(confettiAt(1).every((piece) => piece.opacity === 0)).toBe(true);
  });

  it("is the same for the same progress and mixes orange with ink", () => {
    expect(confettiAt(0.3)).toEqual(confettiAt(0.3));
    const tones = new Set(confettiAt(0.3).map((piece) => piece.tone));
    expect(tones).toEqual(new Set(["signal", "ink"]));
  });
});
