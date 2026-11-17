import { assertNever } from "./assertNever";
import type { AgentAction, AgentFrame } from "./AgentTimeline";
import { clamp01, squashStretch, type Scale2 } from "./easing";
import { HOP_PHASES } from "./StageLayout";

/** The eyes: how open (1 open, near 0 shut), where they look, and whether they are happy little arcs. */
export type Eyes = Readonly<{ open: number; x: number; y: number; happy: boolean }>;

/** How the character is posed at one moment. Lengths are stage units, angles degrees. */
export type AgentPose = Readonly<{
  /** The body raised off its feet: the walking bob, an arrival hop, a happy jump. */
  bob: number;
  /** Squash and stretch, about the feet. */
  scale: Scale2;
  /** Lean or head-shake. */
  tilt: number;
  /** How high each foot is lifted. */
  feet: readonly [number, number];
  /** Arm angles from hanging down; positive raises the arm out to its side. */
  arms: Readonly<{ left: number; right: number }>;
  eyes: Eyes;
  /** The antenna light, 0 to 1. */
  glow: number;
}>;

/** One blink every so often, and a double blink now and then. */
const BLINK = { everyMs: 3300, lastsMs: 130, doubleEvery: 3 } as const;
/** The arrival hop at the start of work. */
const ARRIVAL = { hopMs: 260, settleMs: 200, height: 6 } as const;
/** Arms hanging at rest, slightly out. */
const ARM_REST = 14;
/** Arms turned in to hold the ticket in front of the belly. */
const ARM_HOLD = -24;
/** An arm raised past this is waving or cheering, and lets go of the ticket. */
const ARM_RAISED = 90;

const RESTING: AgentPose = {
  bob: 0,
  scale: { x: 1, y: 1 },
  tilt: 0,
  feet: [0, 0],
  arms: { left: ARM_REST, right: ARM_REST },
  eyes: { open: 1, x: 0, y: 0, happy: false },
  glow: 0.4,
};

/**
 * Turns a frame into the character's pose: the walking bob and footsteps, blinking, the antenna pulsing
 * while it thinks, the hop on arrival, the head-shake, the celebration and the wave. `clockMs` is wall
 * time, so it keeps blinking while the route waits. Made `still`, it gives one calm pose per state and
 * ignores the clock, for visitors who prefer reduced motion.
 */
export class AgentPoser {
  public constructor(private readonly still: boolean) {}

  /** The pose for `frame` at wall time `clockMs`. */
  public pose(frame: AgentFrame, clockMs: number): AgentPose {
    const clock = this.still ? 0 : clockMs;
    const eyes: Eyes = { ...RESTING.eyes, open: this.still ? 1 : this.blink(clock), x: frame.look.x, y: frame.look.y };
    const posed = this.posed(frame.action, frame.stride, clock, eyes);
    const pose = frame.hold.kind === "held" ? this.holding(posed) : posed;
    return this.still ? { ...pose, bob: 0, feet: [0, 0], tilt: 0, scale: RESTING.scale } : pose;
  }

  /** Carrying the ticket: the arms turn in to hold it, keeping a little of their swing; a raised arm stays up. */
  private holding(pose: AgentPose): AgentPose {
    const grip = (angle: number): number => (angle > ARM_RAISED ? angle : ARM_HOLD + (angle - ARM_REST) * 0.3);
    return { ...pose, arms: { left: grip(pose.arms.left), right: grip(pose.arms.right) } };
  }

  private posed(action: AgentAction, stride: number, clock: number, eyes: Eyes): AgentPose {
    switch (action.kind) {
      case "pickup":
        return { ...RESTING, eyes, bob: this.breath(clock), arms: this.reach(action.progress) };
      case "walk":
        return action.airborne ? this.hop(action.progress, eyes) : this.walk(stride, eyes);
      case "work":
        return this.work(action, clock, eyes);
      case "shake":
        return this.shake(action.progress, eyes);
      case "ship":
        return this.celebrate(action.progress, clock, eyes);
      case "greet":
        return this.wave(action.progress, clock, eyes);
      default:
        return assertNever(action);
    }
  }

  /** Open, with a quick blink every few seconds (and a double one every third time). */
  private blink(clock: number): number {
    const cycle = Math.floor(clock / BLINK.everyMs);
    const into = clock - cycle * BLINK.everyMs - BLINK.everyMs / 2;
    const shut = (at: number): boolean => into >= at && into < at + BLINK.lastsMs;
    const double = cycle % BLINK.doubleEvery === BLINK.doubleEvery - 1;
    return shut(0) || (double && shut(BLINK.lastsMs * 2)) ? 0.1 : 1;
  }

  /** A slow breath while standing. */
  private breath(clock: number): number {
    return 0.6 * (1 + Math.sin((2 * Math.PI * clock) / 1800));
  }

  /** Arms reach down for the ticket, then come up holding it. */
  private reach(progress: number): AgentPose["arms"] {
    const lowered = Math.sin(Math.PI * clamp01((progress - 0.1) / 0.55));
    return { left: ARM_REST - 10 * lowered, right: ARM_REST - 10 * lowered };
  }

  /** Steps: one foot up then the other, the body bobbing on each, leaning into the walk. */
  private walk(stride: number, eyes: Eyes): AgentPose {
    const phase = Math.sin(Math.PI * stride);
    const swing = 16 * phase;
    return {
      ...RESTING,
      eyes,
      bob: 2.4 * Math.abs(phase),
      feet: [3.2 * Math.max(0, phase), 3.2 * Math.max(0, -phase)],
      tilt: 4 * eyes.x,
      arms: { left: ARM_REST + swing, right: ARM_REST - swing },
    };
  }

  /** A crouch, a stretched flight with tucked feet and arms up, and a squashed landing. */
  private hop(progress: number, eyes: Eyes): AgentPose {
    const airborne = { ...RESTING, eyes, feet: [2.5, 2.5] as const, arms: { left: 70, right: 70 } };
    if (progress < HOP_PHASES.takeoff) {
      const crouch = Math.sin(Math.PI * (progress / HOP_PHASES.takeoff));
      return { ...RESTING, eyes, scale: { x: 1 + 0.12 * crouch, y: 1 - 0.12 * crouch } };
    }
    if (progress < HOP_PHASES.touchdown) {
      return { ...airborne, scale: { x: 0.94, y: 1.08 } };
    }
    const landed = (progress - HOP_PHASES.touchdown) / (1 - HOP_PHASES.touchdown);
    return { ...RESTING, eyes, scale: squashStretch(landed, 0.14) };
  }

  /** A little hop on arrival, then thinking: the antenna pulses and the hands tap away. */
  private work(action: Extract<AgentAction, { kind: "work" }>, clock: number, eyes: Eyes): AgentPose {
    const elapsed = action.elapsedMs;
    const glow = 0.55 + 0.45 * Math.sin((2 * Math.PI * clock) / 620);
    const tap = 7 * Math.sin((2 * Math.PI * clock) / 300);
    const working = { ...RESTING, eyes, glow, arms: { left: ARM_REST + tap, right: ARM_REST - tap } };
    if (elapsed < ARRIVAL.hopMs) {
      return { ...working, bob: ARRIVAL.height * Math.sin((Math.PI * elapsed) / ARRIVAL.hopMs) };
    }
    if (elapsed < ARRIVAL.hopMs + ARRIVAL.settleMs) {
      return { ...working, scale: squashStretch((elapsed - ARRIVAL.hopMs) / ARRIVAL.settleMs, 0.1) };
    }
    const pleased = action.outcome === "passed" && action.progress > 0.62;
    return { ...working, bob: this.breath(clock), eyes: { ...eyes, happy: pleased } };
  }

  /** "Oh no": a damped shake of the head, eyes squeezed a little. */
  private shake(progress: number, eyes: Eyes): AgentPose {
    return {
      ...RESTING,
      eyes: { ...eyes, open: Math.min(eyes.open, 0.55) },
      tilt: 9 * Math.sin(2 * Math.PI * 3 * progress) * (1 - progress),
      arms: { left: ARM_REST - 6, right: ARM_REST - 6 },
      glow: 0.15,
    };
  }

  /** Drops the ticket in, then a happy jump with both arms up and a squashed landing. */
  private celebrate(progress: number, clock: number, eyes: Eyes): AgentPose {
    const jump = clamp01((progress - 0.3) / 0.32);
    if (progress < 0.3) {
      return { ...RESTING, eyes, arms: { left: ARM_REST - 8, right: ARM_REST - 8 } };
    }
    const happy = { ...eyes, happy: true, x: 0, y: 0 };
    const cheer = progress < 0.85 ? 150 + 10 * Math.sin((2 * Math.PI * clock) / 260) : ARM_REST;
    if (jump < 1) {
      return {
        ...RESTING,
        eyes: happy,
        glow: 1,
        bob: 8 * Math.sin(Math.PI * jump),
        feet: [2, 2],
        arms: { left: cheer, right: cheer },
        scale: { x: 1 - 0.05 * Math.sin(Math.PI * jump), y: 1 + 0.07 * Math.sin(Math.PI * jump) },
      };
    }
    const landed = clamp01((progress - 0.62) / 0.3);
    return { ...RESTING, eyes: happy, glow: 1 - 0.6 * landed, arms: { left: cheer, right: cheer }, scale: squashStretch(landed, 0.16) };
  }

  /** "hi!": faces you with happy eyes and waves the right arm. */
  private wave(progress: number, clock: number, eyes: Eyes): AgentPose {
    const wave = this.still ? 0 : 22 * Math.sin(2 * Math.PI * 4 * progress);
    return {
      ...RESTING,
      eyes: { ...eyes, happy: true, x: 0, y: 0 },
      bob: this.breath(clock),
      tilt: -3,
      arms: { left: ARM_REST, right: 145 + wave },
      glow: 0.8,
    };
  }
}
