import type { DepartmentId, OrchestraStep } from "@/content";
import type { Roster } from "./Roster";

/** Where the ticket is in the story. */
export type Phase =
  | Readonly<{ kind: "waiting" }>
  /** The packet is on its way from `from` to `to`; step `step` has been dispatched. */
  | Readonly<{ kind: "transit"; step: number; from: DepartmentId; to: DepartmentId }>
  /** The department of step `step` holds the ticket and is working on it. */
  | Readonly<{ kind: "holding"; step: number }>;

export type DepartmentStatus =
  | Readonly<{ kind: "idle" }>
  | Readonly<{ kind: "working"; rows: readonly string[] }>
  | Readonly<{ kind: "handing-off"; to: DepartmentId }>
  | Readonly<{ kind: "automated" }>;

export type DepartmentState = Readonly<{
  status: DepartmentStatus;
  /** Held the ticket earlier and is no longer working on it. */
  done: boolean;
}>;

/** A hairline between two departments that hand work to each other. */
export type Channel = Readonly<{
  /** Order-free key of the pair. */
  key: string;
  /** The direction of its first handoff. */
  from: DepartmentId;
  to: DepartmentId;
}>;

export type ChannelStatus = "unused" | "carrying" | "used";

/** Everything discrete on screen at one moment; React re-renders only when this changes. */
export type BoardState = Readonly<{
  principles: number;
  statsShown: boolean;
  phase: Phase;
  departments: ReadonlyMap<DepartmentId, DepartmentState>;
  channels: ReadonlyMap<string, ChannelStatus>;
  /** How many steps have been dispatched, from the first; each one is a log line. */
  dispatched: number;
}>;

const PRINCIPLES_FROM = 0.2;
const PRINCIPLES_STEP = 0.15;
const STATS_AT = 0.55;
const STEPS_FROM = 0.15;
const STEPS_TO = 0.95;
/** Share of a step's scroll window the packet spends travelling to a new department. */
const TRANSIT_SHARE = 0.5;
/** Guards float error so a step starts exactly on its threshold. */
const EPSILON = 1e-9;

const IDLE: DepartmentStatus = { kind: "idle" };
const AUTOMATED: DepartmentStatus = { kind: "automated" };

/** The order-free key of a pair of departments. */
export function channelKey(a: DepartmentId, b: DepartmentId): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * Maps progress through the pinned frame to the lifecycle on the board.
 *
 * Pin progress 0.15 → 0.95 is split evenly over the steps. When a step moves
 * the ticket to another department, the first half of its window is the
 * handoff (the packet travels, the sender shows "handing off"); the second
 * half is the receiving department at work. Stateless: scrolling back rewinds.
 */
export class LifecycleScript {
  private readonly window: number;
  private readonly channelList: readonly Channel[];

  public constructor(
    private readonly steps: readonly OrchestraStep[],
    private readonly roster: Roster,
    private readonly principleCount: number,
  ) {
    if (steps.length === 0) {
      throw new RangeError("A lifecycle needs at least one step");
    }
    if (!(principleCount >= 0)) {
      throw new RangeError("The principle count cannot be negative");
    }
    this.window = (STEPS_TO - STEPS_FROM) / steps.length;
    this.channelList = LifecycleScript.channelsOf(steps);
  }

  private static channelsOf(steps: readonly OrchestraStep[]): readonly Channel[] {
    const channels = new Map<string, Channel>();
    steps.forEach((step, index) => {
      const previous = index > 0 ? steps[index - 1] : undefined;
      if (previous === undefined || previous.department === step.department) {
        return;
      }
      const key = channelKey(previous.department, step.department);
      if (!channels.has(key)) {
        channels.set(key, { key, from: previous.department, to: step.department });
      }
    });
    return [...channels.values()];
  }

  /** Compares the discrete parts that every other field is derived from. */
  public static same(a: BoardState, b: BoardState): boolean {
    return (
      a.principles === b.principles &&
      a.statsShown === b.statsShown &&
      a.dispatched === b.dispatched &&
      a.phase.kind === b.phase.kind
    );
  }

  public stepCount(): number {
    return this.steps.length;
  }

  public step(index: number): OrchestraStep {
    const step = this.steps[index];
    if (step === undefined) {
      throw new RangeError(`No step ${index}`);
    }
    return step;
  }

  /** The ticket on the packet: the one of the step in play, or the first while waiting. */
  public ticketIn(phase: Phase): string {
    return this.step(phase.kind === "waiting" ? 0 : phase.step).ticket;
  }

  /** Every pair of departments that hand work to each other, in order of first use. */
  public channels(): readonly Channel[] {
    return this.channelList;
  }

  /** The step reached at `progress`, or −1 before the first. */
  public stepAt(progress: number): number {
    if (progress < STEPS_FROM - EPSILON) {
      return -1;
    }
    const index = Math.floor((progress - STEPS_FROM) / this.window + EPSILON);
    return Math.min(this.steps.length - 1, index);
  }

  /** Whether step `index` moves the ticket to a different department. */
  public isHandoff(index: number): boolean {
    return index > 0 && this.step(index - 1).department !== this.step(index).department;
  }

  /**
   * How far the packet is through the handoff of the step reached at
   * `progress`: 0 → 1 while travelling, 1 once delivered or when the step
   * stays in the same department.
   */
  public transitAt(progress: number): number {
    const index = this.stepAt(progress);
    if (index < 0 || !this.isHandoff(index)) {
      return 1;
    }
    const start = STEPS_FROM + index * this.window;
    return Math.min(1, Math.max(0, (progress - start) / (this.window * TRANSIT_SHARE)));
  }

  public stateAt(progress: number): BoardState {
    const phase = this.phaseAt(progress);
    return {
      principles: this.principlesAt(progress),
      statsShown: progress >= STATS_AT,
      phase,
      departments: this.departmentsIn(phase),
      channels: this.channelsIn(phase),
      dispatched: this.stepAt(progress) + 1,
    };
  }

  private phaseAt(progress: number): Phase {
    const index = this.stepAt(progress);
    if (index < 0) {
      return { kind: "waiting" };
    }
    if (this.transitAt(progress) < 1) {
      return { kind: "transit", step: index, from: this.step(index - 1).department, to: this.step(index).department };
    }
    return { kind: "holding", step: index };
  }

  private departmentsIn(phase: Phase): ReadonlyMap<DepartmentId, DepartmentState> {
    const current = this.currentStep(phase);
    const visited = new Set(this.steps.slice(0, Math.max(0, current)).map((step) => step.department));
    return new Map(
      this.roster.departmentIds().map((id) => {
        const status = this.statusOf(id, phase);
        return [id, { status, done: visited.has(id) && status.kind === "idle" }] as const;
      }),
    );
  }

  private statusOf(id: DepartmentId, phase: Phase): DepartmentStatus {
    switch (phase.kind) {
      case "waiting":
        return IDLE;
      case "transit":
        return phase.from === id ? { kind: "handing-off", to: phase.to } : IDLE;
      case "holding": {
        const step = this.step(phase.step);
        if (step.department !== id) {
          return IDLE;
        }
        return step.workers.length === 0 ? AUTOMATED : { kind: "working", rows: this.roster.busyRows(step) };
      }
      default:
        return assertNever(phase);
    }
  }

  private channelsIn(phase: Phase): ReadonlyMap<string, ChannelStatus> {
    const current = this.currentStep(phase);
    const carrying = phase.kind === "transit" ? channelKey(phase.from, phase.to) : undefined;
    const used = new Set<string>();
    for (let index = 1; index <= current; index += 1) {
      if (this.isHandoff(index)) {
        used.add(channelKey(this.step(index - 1).department, this.step(index).department));
      }
    }
    return new Map(
      this.channelList.map((channel): readonly [string, ChannelStatus] => {
        if (channel.key === carrying) {
          return [channel.key, "carrying"];
        }
        return [channel.key, used.has(channel.key) ? "used" : "unused"];
      }),
    );
  }

  /** The last step fully delivered: during a transit that is the one before it. */
  private currentStep(phase: Phase): number {
    switch (phase.kind) {
      case "waiting":
        return -1;
      case "transit":
        return phase.step - 1;
      case "holding":
        return phase.step;
      default:
        return assertNever(phase);
    }
  }

  private principlesAt(progress: number): number {
    if (progress < PRINCIPLES_FROM - EPSILON) {
      return 0;
    }
    const passed = Math.floor((progress - PRINCIPLES_FROM) / PRINCIPLES_STEP + EPSILON) + 1;
    return Math.min(this.principleCount, passed);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}
