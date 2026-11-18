import type { SessionPromptId } from "@/content";
import { assertNever, type FrameListener, type GhostHands, type GhostMarks, type GhostStep, type Point, type Size } from "@/laptop";
import type { SessionActions } from "./SessionRunner";

/** Something in the agent window the ghost cursor can go to. */
export type SessionTarget = Readonly<{ kind: "rest" }> | Readonly<{ kind: "chip"; prompt: SessionPromptId }>;

/** What the ghost's clicks do: start a run. */
export type SessionEffect = Readonly<{ kind: "start"; prompt: SessionPromptId }>;

/** How the agent window marks its places for the ghost (`data-ghost`), and where on each the cursor rests. */
export class SessionMarks implements GhostMarks<SessionTarget> {
  public readonly rest: SessionTarget = { kind: "rest" };

  public keyOf(target: SessionTarget): string {
    switch (target.kind) {
      case "rest":
        return target.kind;
      case "chip":
        return `chip-${target.prompt}`;
      default:
        return assertNever(target);
    }
  }

  public aim(target: SessionTarget, size: Size): Point {
    switch (target.kind) {
      case "chip":
        return { x: size.width * 0.42, y: size.height * 0.58 };
      case "rest":
        return { x: size.width / 2, y: size.height / 2 };
      default:
        return assertNever(target);
    }
  }
}

/** Turns the ghost's clicks into the same action a visitor's would take. */
export class SessionHands implements GhostHands<SessionEffect> {
  public constructor(private readonly actions: SessionActions) {}

  public apply(effect: SessionEffect): void {
    this.actions.start(effect.prompt, "ghost");
  }

  /** The window keeps no menus, so there is nothing to put back before a loop. */
  public tidy(): void {}

  /** And a run the ghost started plays on when the visitor takes over: they came to watch it. */
  public letGo(): void {}
}

/** The ghost's calm loop: for each prompt in turn, it clicks the chip, steps back to watch the run for `watchMs`, and rests. */
export function sessionGhostLoop(order: readonly SessionPromptId[], watchMs: number): readonly GhostStep<SessionTarget, SessionEffect>[] {
  if (order.length === 0) {
    throw new Error("The ghost needs at least one prompt to run");
  }
  const stepBack = 1700;
  const settle = 600;
  if (!(watchMs > stepBack + settle)) {
    throw new Error(`The ghost watches each run for longer than it takes to step back: ${watchMs}`);
  }
  return order.flatMap((prompt): readonly GhostStep<SessionTarget, SessionEffect>[] => [
    { kind: "wait", ms: 1400 },
    { kind: "move", to: { kind: "chip", prompt }, ms: 1500 },
    { kind: "wait", ms: 700 },
    { kind: "click", effect: { kind: "start", prompt }, ms: 400 },
    { kind: "wait", ms: settle },
    { kind: "move", to: { kind: "rest" }, ms: stepBack },
    { kind: "wait", ms: watchMs - stepBack - settle },
  ]);
}

/** The ghost's side of a run: whether the visitor's own run is still on screen. */
export interface VisitorRun {
  visitorWatching(graceMs: number): boolean;
}

/**
 * Keeps the ghost away while the visitor's own run plays out and for `graceMs` after it ends, so the
 * visitor sees their pull request open; then the ghost starts its loop afresh.
 */
export class PatientGhost implements FrameListener {
  public constructor(
    private readonly ghost: FrameListener,
    private readonly session: VisitorRun,
    private readonly graceMs: number,
  ) {}

  public frame(now: number, stepMs: number): void {
    if (this.session.visitorWatching(this.graceMs)) {
      this.ghost.halt();
      return;
    }
    this.ghost.frame(now, stepMs);
  }

  public halt(): void {
    this.ghost.halt();
  }
}
