import { LoopTimeline } from "@/ui";

/** The beats of one agent turn, in order. */
export type AgentBeat = "typing" | "sent" | "calling" | "result" | "reply";

const ORDER: readonly AgentBeat[] = ["typing", "sent", "calling", "result", "reply"];

/** How long each beat holds, in ms; the reply holds longest so it can be read. */
const DURATIONS: Readonly<Record<AgentBeat, number>> = {
  typing: 1800,
  sent: 700,
  calling: 1500,
  result: 1600,
  reply: 3000,
};

/** Typing runs this much faster than its beat, so the full prompt sits in the composer for a moment. */
const TYPING_LEAD = 1.3;

/**
 * The agent panel's loop: the prompt is typed and sent, the agent calls a tool, the result lands and the
 * agent replies, then it starts over. Steps are indices into the beat order, so "has the loop reached
 * the result yet" is a comparison.
 */
export class AgentScript {
  private readonly timeline: LoopTimeline;

  /** `promptLength` is the number of characters typed into the composer; at least one. */
  public constructor(private readonly promptLength: number) {
    if (!Number.isInteger(promptLength) || promptLength < 1) {
      throw new Error(`A prompt needs at least one character, not ${promptLength}`);
    }
    this.timeline = new LoopTimeline(ORDER.map((beat) => DURATIONS[beat]));
  }

  /** The step shown when nothing plays (reduced motion, off screen, before hydration): the finished turn. */
  public static finalStep(): number {
    return ORDER.length - 1;
  }

  /** The step for a beat, to compare against `stepAt`. */
  public static stepOf(beat: AgentBeat): number {
    return ORDER.indexOf(beat);
  }

  /** One pass of the loop, in ms. */
  public duration(): number {
    return this.timeline.duration();
  }

  /** The step playing `elapsedMs` after the loop started. */
  public stepAt(elapsedMs: number): number {
    return this.timeline.beatAt(elapsedMs);
  }

  /** How many characters of the prompt sit in the composer; none once it has been sent. */
  public typedAt(elapsedMs: number): number {
    if (this.timeline.beatAt(elapsedMs) !== AgentScript.stepOf("typing")) {
      return 0;
    }
    const typed = Math.ceil(this.timeline.progressAt(elapsedMs) * TYPING_LEAD * this.promptLength);
    return Math.min(this.promptLength, typed);
  }
}
