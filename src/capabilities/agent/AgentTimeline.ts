import type { AgentStationId, AgentTicket, AgentToolCall } from "@/content";
import { AgentRoute, type RouteStep, type ToolStation, type WorkOutcome } from "./AgentRoute";
import { assertNever } from "./assertNever";
import type { RetryPlan } from "./RetryPlan";
import type { Leg, Point, StageLayout } from "./StageLayout";

/** How long each kind of beat lasts, in ms. Walks take their length from the stage. */
export type AgentTimings = Readonly<{
  pickupMs: number;
  workMs: Readonly<Record<ToolStation, number>>;
  /** The second visit to Code, after a failing test. */
  fixMs: number;
  /** The head-shake after a failing test. */
  shakeMs: number;
  /** Dropping the ticket in and the pop. */
  shipMs: number;
}>;

/** A place in the endless run: which episode (ticket), which beat of it, and how far through that beat. */
export type TimelineCursor = Readonly<{ episode: number; step: number; progress: number }>;

/** What the agent is doing, how far through it (0 to 1), and for how long it has been at it, in ms. */
export type AgentAction =
  | Readonly<{ kind: "pickup"; progress: number; elapsedMs: number }>
  | Readonly<{ kind: "walk"; airborne: boolean; progress: number; elapsedMs: number }>
  | Readonly<{ kind: "work"; at: ToolStation; outcome: WorkOutcome; progress: number; elapsedMs: number }>
  | Readonly<{ kind: "shake"; progress: number; elapsedMs: number }>
  | Readonly<{ kind: "ship"; progress: number; elapsedMs: number }>
  | Readonly<{ kind: "greet"; progress: number; elapsedMs: number }>;

/** Where the ticket is: not held, flying up from the inbox into the agent's hands, held, or dropping into Ship. */
export type TicketHold =
  | Readonly<{ kind: "none" }>
  | Readonly<{ kind: "rising"; progress: number }>
  | Readonly<{ kind: "held" }>
  | Readonly<{ kind: "dropping"; progress: number }>;

/** How a speech bubble reads: the ticket's name, a plain tool call, a passing or failing run, or a hello. */
export type BubbleTone = "ticket" | "call" | "passed" | "failed" | "hello";

/** A speech bubble over the agent; a new `key` pops a new bubble in. */
export type Bubble = Readonly<{ key: string; text: string; result: string | null; tone: BubbleTone }>;

/** Everything drawn at one moment. Positions are in stage units. */
export type AgentFrame = Readonly<{
  /** The floor point under the agent. */
  position: Point;
  /** How high it is off the floor. */
  lift: number;
  /** Footsteps taken on the current walk, for the legs and the bob. */
  stride: number;
  /** Where its eyes point, a direction of length 0 or 1. */
  look: Point;
  action: AgentAction;
  ticket: AgentTicket;
  /** Counts tickets from 0; a new one starts at each pickup. */
  episode: number;
  hold: TicketHold;
  /** Whether this episode's ticket has gone into Ship. */
  delivered: boolean;
  /** Tickets shipped so far. */
  shipped: number;
  /** The station lit orange, if one is working. */
  lit: AgentStationId | null;
  bubble: Bubble | null;
  /** How far the ship pop has played, 0 to 1, while it plays. */
  pop: number | null;
}>;

/** A beat with its length and where it sits in its episode. */
type Beat = Readonly<{
  step: RouteStep;
  startMs: number;
  durationMs: number;
  /** The walk's path, for walks. */
  leg: Leg | null;
  /** Where the agent stands during the beat (the start of a walk). */
  here: Point;
  /** The next place it will walk to, for its eyes. */
  ahead: Point;
}>;

type Episode = Readonly<{ beats: readonly Beat[]; durationMs: number; shipStep: number }>;

/** Pickup: the bubble names the ticket from here; the hands reach between these two points. */
const PICKUP = { bubble: 0.25, reach: 0.2, grab: 0.6 } as const;
/** Work: the bubble pops in after the arrival hop, the result shows from `result`, the eyes glance ahead from `glance`. */
const WORK = { bubble: 0.12, result: 0.58, glance: 0.72 } as const;
/** Ship: the ticket drops in until `drop`, then the pop plays. */
const SHIP = { drop: 0.3 } as const;

const STILL_EYES: Point = { x: 0, y: 0 };
const DOWN: Point = { x: 0, y: 1 };
const NO_TICKET: TicketHold = { kind: "none" };
const HELD: TicketHold = { kind: "held" };

/** The unit direction from `from` to `to`, or none when they are the same point. */
function toward(from: Point, to: Point): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  return length < 1e-6 ? STILL_EYES : { x: dx / length, y: dy / length };
}

/**
 * The agent's choreography as a pure function of time: for any `t` (ms since the run began) it says
 * where the agent is, what it is doing, which ticket it carries, what its bubble says and which station
 * is lit. Tickets are taken in turn; the retry plan decides which ones fail a test first. Episodes come
 * in blocks of equal length (one retry per block), so finding the moment for any `t` is quick.
 */
export class AgentTimeline {
  private readonly episodes: readonly (readonly [Episode, Episode])[];
  private readonly blockMs: number;

  public constructor(
    private readonly layout: StageLayout,
    private readonly tickets: readonly AgentTicket[],
    private readonly plan: RetryPlan,
    private readonly timings: AgentTimings,
  ) {
    if (tickets.length === 0) {
      throw new Error("The agent needs at least one ticket");
    }
    this.episodes = tickets.map((ticket) => [this.plot(ticket, false), this.plot(ticket, true)] as const);
    const clean = this.episodes[0][0].durationMs;
    const retry = this.episodes[0][1].durationMs;
    this.blockMs = clean * (plan.blockSize() - 1) + retry;
  }

  /** How long one ticket takes, in ms, with or without the failing test. */
  public episodeMs(retry: boolean): number {
    return this.episodes[0][retry ? 1 : 0].durationMs;
  }

  /** Which episode and beat is playing at `t`. */
  public cursorAt(t: number): TimelineCursor {
    if (!Number.isFinite(t) || t < 0) {
      throw new Error(`Time runs from 0, not ${t}`);
    }
    const block = Math.floor(t / this.blockMs);
    let rest = t - block * this.blockMs;
    const size = this.plan.blockSize();
    for (let slot = 0; slot < size; slot += 1) {
      const episode = block * size + slot;
      const shape = this.shapeOf(episode);
      if (rest < shape.durationMs || slot === size - 1) {
        return this.cursorIn(episode, shape, Math.min(rest, shape.durationMs - 1e-6));
      }
      rest -= shape.durationMs;
    }
    throw new Error("Unreachable: a block always ends in its last slot");
  }

  /** The time at `cursor`: the inverse of `cursorAt`, used to keep the agent's place when the stage changes. */
  public timeAt(cursor: TimelineCursor): number {
    const size = this.plan.blockSize();
    const block = Math.floor(cursor.episode / size);
    let time = block * this.blockMs;
    for (let episode = block * size; episode < cursor.episode; episode += 1) {
      time += this.shapeOf(episode).durationMs;
    }
    const beats = this.shapeOf(cursor.episode).beats;
    const beat = beats[Math.min(Math.max(0, cursor.step), beats.length - 1)];
    return time + beat.startMs + beat.durationMs * Math.min(1, Math.max(0, cursor.progress));
  }

  /** The time, in the first ticket, when the agent is `fraction` of the way through its work at `station`. */
  public momentAt(station: ToolStation, fraction: number): number {
    const step = this.shapeOf(0).beats.findIndex((beat) => beat.step.kind === "work" && beat.step.at === station);
    return this.timeAt({ episode: 0, step, progress: fraction });
  }

  /** Everything drawn at `t`. */
  public frameAt(t: number): AgentFrame {
    const cursor = this.cursorAt(t);
    const shape = this.shapeOf(cursor.episode);
    const beat = shape.beats[cursor.step];
    const progress = cursor.progress;
    const elapsedMs = progress * beat.durationMs;
    const delivered = cursor.step > shape.shipStep || (cursor.step === shape.shipStep && progress >= SHIP.drop);
    const ticket = this.tickets[cursor.episode % this.tickets.length];
    const base = {
      position: beat.here,
      lift: 0,
      stride: 0,
      ticket,
      episode: cursor.episode,
      delivered,
      shipped: cursor.episode + (delivered ? 1 : 0),
      hold: delivered ? NO_TICKET : HELD,
      lit: null,
      bubble: null,
      pop: null,
    };
    const step = beat.step;
    switch (step.kind) {
      case "pickup":
        return {
          ...base,
          action: { kind: "pickup", progress, elapsedMs },
          lit: "inbox",
          hold: this.pickupHold(progress),
          look: progress < PICKUP.grab ? DOWN : toward(beat.here, beat.ahead),
          bubble:
            progress < PICKUP.bubble
              ? null
              : { key: `${cursor.episode}:ticket`, text: ticket.id, result: ticket.title, tone: "ticket" },
        };
      case "walk": {
        const leg = this.legOf(beat);
        const spot = leg.at(progress);
        return {
          ...base,
          position: spot.ground,
          lift: spot.lift,
          stride: spot.stride,
          action: { kind: "walk", airborne: leg.airborne, progress, elapsedMs },
          look: toward(this.layout.spot(step.from), this.layout.spot(step.to)),
        };
      }
      case "work":
        return {
          ...base,
          action: { kind: "work", at: step.at, outcome: step.outcome, progress, elapsedMs },
          lit: step.at,
          look: progress < WORK.glance ? DOWN : toward(beat.here, beat.ahead),
          bubble: progress < WORK.bubble ? null : this.workBubble(cursor, step.call, step.outcome, progress),
        };
      case "shake":
        return {
          ...base,
          action: { kind: "shake", progress, elapsedMs },
          lit: "test",
          look: STILL_EYES,
          bubble: { key: `${cursor.episode}:failed`, text: step.call.call, result: step.call.result ?? null, tone: "failed" },
        };
      case "ship":
        return {
          ...base,
          action: { kind: "ship", progress, elapsedMs },
          lit: "ship",
          hold: delivered ? NO_TICKET : { kind: "dropping", progress: progress / SHIP.drop },
          look: delivered ? STILL_EYES : DOWN,
          pop: delivered ? (progress - SHIP.drop) / (1 - SHIP.drop) : null,
        };
      default:
        return assertNever(step);
    }
  }

  private cursorIn(episode: number, shape: Episode, offset: number): TimelineCursor {
    const step = shape.beats.findIndex((beat) => offset < beat.startMs + beat.durationMs);
    const index = step === -1 ? shape.beats.length - 1 : step;
    const beat = shape.beats[index];
    return { episode, step: index, progress: Math.min(1, Math.max(0, (offset - beat.startMs) / beat.durationMs)) };
  }

  private shapeOf(episode: number): Episode {
    return this.episodes[episode % this.tickets.length][this.plan.retries(episode) ? 1 : 0];
  }

  private pickupHold(progress: number): TicketHold {
    if (progress < PICKUP.reach) {
      return NO_TICKET;
    }
    if (progress < PICKUP.grab) {
      return { kind: "rising", progress: (progress - PICKUP.reach) / (PICKUP.grab - PICKUP.reach) };
    }
    return HELD;
  }

  private workBubble(cursor: TimelineCursor, call: AgentToolCall, outcome: WorkOutcome, progress: number): Bubble {
    const result = progress >= WORK.result ? (call.result ?? null) : null;
    const key = outcome === "failed" ? `${cursor.episode}:failed` : `${cursor.episode}:${cursor.step}`;
    return { key, text: call.call, result, tone: result === null ? "call" : this.toneOf(outcome) };
  }

  private toneOf(outcome: WorkOutcome): BubbleTone {
    switch (outcome) {
      case "passed":
        return "passed";
      case "failed":
        return "failed";
      case "done":
      case "fixed":
        return "call";
      default:
        return assertNever(outcome);
    }
  }

  private legOf(beat: Beat): Leg {
    if (beat.leg === null) {
      throw new Error("A walk beat always has a leg");
    }
    return beat.leg;
  }

  /** Gives each step of a ticket's route its length, its start, and the places it happens. */
  private plot(ticket: AgentTicket, retry: boolean): Episode {
    const steps = new AgentRoute(ticket, retry).steps();
    const beats: Beat[] = [];
    let at: AgentStationId = "inbox";
    let startMs = 0;
    for (const [index, step] of steps.entries()) {
      const leg = step.kind === "walk" ? this.layout.leg(step.from, step.to) : null;
      const durationMs = this.durationOf(step, leg);
      const next = steps.slice(index + 1).find((later) => later.kind === "walk");
      const goal = step.kind === "walk" ? step.to : next?.kind === "walk" ? next.to : at;
      beats.push({ step, startMs, durationMs, leg, here: this.layout.spot(at), ahead: this.layout.spot(goal) });
      startMs += durationMs;
      if (step.kind === "walk") {
        at = step.to;
      }
    }
    const shipStep = beats.findIndex((beat) => beat.step.kind === "ship");
    return { beats, durationMs: startMs, shipStep };
  }

  private durationOf(step: RouteStep, leg: Leg | null): number {
    switch (step.kind) {
      case "pickup":
        return this.timings.pickupMs;
      case "walk":
        return leg === null ? 0 : leg.durationMs;
      case "work":
        return step.outcome === "fixed" ? this.timings.fixMs : this.timings.workMs[step.at];
      case "shake":
        return this.timings.shakeMs;
      case "ship":
        return this.timings.shipMs;
      default:
        return assertNever(step);
    }
  }
}
