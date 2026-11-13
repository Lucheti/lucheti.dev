import type { SagaStep } from "@/content";

export type NodeId = "client" | "gateway" | "orchestrator" | `service:${number}`;

export function serviceNode(index: number): NodeId {
  return `service:${index}`;
}

/** The step index a service node stands for, or null for the edge and the hub. */
export function serviceIndex(id: NodeId): number | null {
  return id.startsWith("service:") ? Number(id.slice("service:".length)) : null;
}

export type ServiceStatus = "idle" | "running" | "done" | "failed" | "compensating" | "compensated";

export type Outcome = "idle" | "running" | "committed" | "rolledBack";

export type TokenTone = "forward" | "compensation";

export type LogTone = "normal" | "failure" | "compensation";

export type LogEntry = Readonly<{
  /** "Orchestrator → Payments" or a lone service name. */
  route: string;
  detail: string;
  tone: LogTone;
}>;

/** Everything the diagram shows apart from the travelling token. */
export type SagaFrame = Readonly<{
  statuses: readonly ServiceStatus[];
  log: readonly LogEntry[];
  outcome: Outcome;
}>;

export type SagaLabels = Readonly<{ client: string; gateway: string; orchestrator: string }>;

export type SagaTiming = Readonly<{
  /** The two edge hops: client to gateway, gateway to orchestrator. */
  ingressMs: number;
  /** One way between the orchestrator and a service. */
  hopMs: number;
  /** A service doing its work (or its undo). */
  workMs: number;
}>;

export const ANIMATED_TIMING: SagaTiming = { ingressMs: 380, hopMs: 450, workMs: 320 };

/** No travelling tokens: statuses simply step every 400ms. */
export const STEPPED_TIMING: SagaTiming = { ingressMs: 0, hopMs: 0, workMs: 400 };

const JWT_NOTE = "JWT verified";
const FAILED_NOTE = "✕ failed";

/** One leg of the token's journey. Immutable, so the player can compare by reference. */
export class TokenSegment {
  public constructor(
    public readonly from: NodeId,
    public readonly to: NodeId,
    public readonly tone: TokenTone,
    private readonly startMs: number,
    private readonly endMs: number,
  ) {}

  public covers(timeMs: number): boolean {
    return timeMs >= this.startMs && timeMs < this.endMs;
  }

  public fractionAt(timeMs: number): number {
    const span = this.endMs - this.startMs;
    return Math.min(1, Math.max(0, (timeMs - this.startMs) / span));
  }
}

type TimedFrame = Readonly<{ atMs: number; frame: SagaFrame }>;

/** Accumulates the script of one run: a moving cursor, working state and the frames it emitted. */
class ScriptBuilder {
  private cursorMs = 0;
  private readonly statuses: ServiceStatus[];
  private readonly log: LogEntry[] = [];
  private outcome: Outcome = "idle";
  private readonly frames: TimedFrame[] = [];
  private readonly segments: TokenSegment[] = [];

  public constructor(stepCount: number) {
    this.statuses = Array.from({ length: stepCount }, () => "idle" as const);
    this.frames.push({ atMs: Number.NEGATIVE_INFINITY, frame: this.freeze() });
  }

  public say(entry: LogEntry): void {
    this.log.push(entry);
  }

  public setStatus(index: number, status: ServiceStatus): void {
    this.statuses[index] = status;
  }

  public setOutcome(outcome: Outcome): void {
    this.outcome = outcome;
  }

  /** Records the working state as it stands at the cursor. */
  public emit(): void {
    this.frames.push({ atMs: this.cursorMs, frame: this.freeze() });
  }

  public travel(from: NodeId, to: NodeId, tone: TokenTone, durationMs: number): void {
    if (durationMs <= 0) {
      return;
    }
    this.segments.push(new TokenSegment(from, to, tone, this.cursorMs, this.cursorMs + durationMs));
    this.cursorMs += durationMs;
  }

  public wait(durationMs: number): void {
    this.cursorMs += durationMs;
  }

  public result(): Readonly<{ frames: readonly TimedFrame[]; segments: readonly TokenSegment[]; durationMs: number }> {
    return { frames: this.frames, segments: this.segments, durationMs: this.cursorMs };
  }

  private freeze(): SagaFrame {
    return Object.freeze({
      statuses: Object.freeze([...this.statuses]),
      log: Object.freeze([...this.log]),
      outcome: this.outcome,
    });
  }
}

/** The frame before anything has run. */
export function idleFrame(stepCount: number): SagaFrame {
  return Object.freeze({
    statuses: Object.freeze(Array.from({ length: stepCount }, () => "idle" as const)),
    log: Object.freeze([]),
    outcome: "idle",
  });
}

/**
 * The whole run of one saga, compiled up front into immutable frames and token legs.
 * Given a time it answers what is on screen; it never advances by itself, so the
 * player only needs a clock.
 *
 * With `failingIndex === null` every step commits. Otherwise that step fails, the
 * steps after it never start, and the steps before it are compensated in reverse
 * order, skipping those with nothing to undo.
 */
export class SagaSequencer {
  private readonly frames: readonly TimedFrame[];
  private readonly segments: readonly TokenSegment[];
  private readonly total: number;

  public constructor(
    steps: readonly SagaStep[],
    failingIndex: number | null,
    labels: SagaLabels,
    timing: SagaTiming,
  ) {
    if (steps.length === 0) {
      throw new Error("A saga needs at least one step.");
    }
    if (failingIndex !== null && (!Number.isInteger(failingIndex) || failingIndex < 0 || failingIndex >= steps.length)) {
      throw new Error(`Failing step ${failingIndex} is outside the ${steps.length} steps.`);
    }

    const script = new ScriptBuilder(steps.length);
    this.compile(script, steps, failingIndex, labels, timing);
    const { frames, segments, durationMs } = script.result();
    this.frames = frames;
    this.segments = segments;
    this.total = durationMs;
  }

  public get durationMs(): number {
    return this.total;
  }

  /** The state on screen at `timeMs`; the same object until something changes. */
  public frameAt(timeMs: number): SagaFrame {
    for (let index = this.frames.length - 1; index >= 0; index -= 1) {
      const timed = this.frames[index];
      if (timed.atMs <= timeMs) {
        return timed.frame;
      }
    }
    return this.frames[0].frame;
  }

  /** The leg the token is travelling at `timeMs`, or null while it rests. */
  public segmentAt(timeMs: number): TokenSegment | null {
    for (const segment of this.segments) {
      if (segment.covers(timeMs)) {
        return segment;
      }
    }
    return null;
  }

  private compile(
    script: ScriptBuilder,
    steps: readonly SagaStep[],
    failingIndex: number | null,
    labels: SagaLabels,
    timing: SagaTiming,
  ): void {
    const { client, gateway, orchestrator } = labels;
    const lastForward = failingIndex ?? steps.length - 1;

    script.setOutcome("running");
    script.say({ route: `${client} → ${gateway}`, detail: "", tone: "normal" });
    script.emit();
    script.travel("client", "gateway", "forward", timing.ingressMs);

    script.say({ route: `${gateway} → ${orchestrator}`, detail: JWT_NOTE, tone: "normal" });
    script.emit();
    script.travel("gateway", "orchestrator", "forward", timing.ingressMs);

    for (let index = 0; index <= lastForward; index += 1) {
      const step = steps[index];
      const node = serviceNode(index);
      script.say({ route: `${orchestrator} → ${step.service}`, detail: step.action, tone: "normal" });
      script.emit();
      script.travel("orchestrator", node, "forward", timing.hopMs);

      script.setStatus(index, "running");
      script.emit();
      script.wait(timing.workMs);

      if (index === failingIndex) {
        script.setStatus(index, "failed");
        script.say({ route: step.service, detail: FAILED_NOTE, tone: "failure" });
      } else {
        script.setStatus(index, "done");
      }
      script.emit();
      script.travel(node, "orchestrator", "forward", timing.hopMs);
    }

    if (failingIndex === null) {
      script.setOutcome("committed");
      script.emit();
      return;
    }

    for (let index = failingIndex - 1; index >= 0; index -= 1) {
      const step = steps[index];
      if (step.compensation === "") {
        continue;
      }
      const node = serviceNode(index);
      script.say({ route: `${orchestrator} → ${step.service}`, detail: step.compensation, tone: "compensation" });
      script.emit();
      script.travel("orchestrator", node, "compensation", timing.hopMs);

      script.setStatus(index, "compensating");
      script.emit();
      script.wait(timing.workMs);

      script.setStatus(index, "compensated");
      script.emit();
      script.travel(node, "orchestrator", "compensation", timing.hopMs);
    }

    script.setOutcome("rolledBack");
    script.emit();
  }
}
