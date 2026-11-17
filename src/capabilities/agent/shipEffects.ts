import { assertNever } from "./assertNever";
import type { TicketHold } from "./AgentTimeline";
import { clamp01, easeInOutSine, easeOutCubic, lerp } from "./easing";
import type { Point, StageLayout } from "./StageLayout";

/** The ticket while it is out of the agent's hands, in stage units. */
export type FlyingTicket = Readonly<{ x: number; y: number; scale: number; opacity: number }>;

/** One bit of confetti from the ship pop, relative to where it bursts from. */
export type ConfettiPiece = Readonly<{
  x: number;
  y: number;
  rotate: number;
  opacity: number;
  tone: "signal" | "ink";
  shape: "dot" | "strip";
}>;

/** How far above its feet the agent holds the ticket. */
export const HANDS_HEIGHT = 18;

const CONFETTI_COUNT = 11;

/** A point `progress` of the way along an arc from `from` to `to`, bowing up by `bow`. */
function arc(from: Point, to: Point, progress: number, bow: number): Point {
  return {
    x: lerp(from.x, to.x, progress),
    y: lerp(from.y, to.y, progress) - bow * Math.sin(Math.PI * progress),
  };
}

/**
 * Where the ticket is while it flies: up from the inbox into the agent's hands, or from its hands down
 * into the Ship mailbox, shrinking and fading as it goes in. Null while it is held or gone.
 */
export function flyingTicket(hold: TicketHold, layout: StageLayout): FlyingTicket | null {
  switch (hold.kind) {
    case "none":
    case "held":
      return null;
    case "rising": {
      const tray = layout.tile("inbox");
      const spot = layout.spot("inbox");
      const p = easeOutCubic(hold.progress);
      const at = arc({ x: tray.x + tray.width / 2, y: tray.y + 14 }, { x: spot.x, y: spot.y - HANDS_HEIGHT }, p, 16);
      return { ...at, scale: lerp(0.7, 1, p), opacity: clamp01(hold.progress * 4) };
    }
    case "dropping": {
      const box = layout.tile("ship");
      const spot = layout.spot("ship");
      const p = easeInOutSine(hold.progress);
      const at = arc({ x: spot.x, y: spot.y - HANDS_HEIGHT }, { x: box.x + box.width / 2, y: box.y + box.height * 0.45 }, p, 12);
      return { ...at, scale: lerp(1, 0.5, p), opacity: 1 - clamp01((hold.progress - 0.7) / 0.3) };
    }
    default:
      return assertNever(hold);
  }
}

/**
 * The confetti of the ship pop, `progress` 0 to 1: a fan of bits thrown up and out, falling back a
 * little and fading. The same progress always gives the same bits.
 */
export function confettiAt(progress: number): readonly ConfettiPiece[] {
  const p = clamp01(progress);
  const flight = easeOutCubic(p);
  const fade = 1 - clamp01((p - 0.6) / 0.4);
  return Array.from({ length: CONFETTI_COUNT }, (_, index) => {
    const spread = index / (CONFETTI_COUNT - 1) - 0.5;
    const angle = -Math.PI / 2 + spread * 2.6;
    const reach = 40 + ((index * 37) % 19);
    return {
      x: Math.cos(angle) * reach * flight,
      y: Math.sin(angle) * reach * flight + 26 * p * p,
      rotate: (index % 2 === 0 ? 1 : -1) * 300 * p,
      opacity: p === 0 ? 0 : fade,
      tone: index % 3 === 0 ? "ink" : "signal",
      shape: index % 2 === 0 ? "strip" : "dot",
    };
  });
}
