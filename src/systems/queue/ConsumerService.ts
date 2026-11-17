import { assertNever } from "./assertNever";
import { jittered, type RandomSource } from "./RandomSource";
import type { ServiceProfile, ServiceRules, ServiceStatus, ServiceView } from "./types";

/** What happened to a service during one step. */
export type ServiceChange =
  | Readonly<{ kind: "completed"; id: number }>
  | Readonly<{ kind: "strained" }>
  | Readonly<{ kind: "relieved" }>
  | Readonly<{ kind: "down"; returned: readonly number[] }>
  | Readonly<{ kind: "restarting" }>
  | Readonly<{ kind: "recovered" }>;

/** What became of a message that reached a service. */
export type Delivery = "accepted" | "bounced";

type Job = Readonly<{ id: number; doneAt: number }>;

const HEALTHY: ServiceStatus = { kind: "healthy" };

/**
 * One consumer service: a few workers, a line of messages waiting for them, and its health. It goes
 * busy above its limit, down when it stays there too long (handing its messages back), then restarts.
 */
export class ConsumerService {
  private status: ServiceStatus = HEALTHY;
  private readonly jobs: Job[] = [];
  private readonly waiting: number[] = [];
  private incoming = 0;
  private processed = 0;
  private restarts = 0;

  public constructor(
    private readonly profile: ServiceProfile,
    private readonly rules: ServiceRules,
    private readonly random: RandomSource,
  ) {
    if (!(profile.workMs > 0)) {
      throw new Error(`A service needs a positive work time: ${profile.workMs}`);
    }
  }

  /** Messages dealt to it and not yet finished or handed back, including the ones on their way. */
  public load(): number {
    return this.jobs.length + this.waiting.length + this.incoming;
  }

  /** Whether the broker may deal it another message while it holds fewer than `cap`. */
  public accepts(cap: number): boolean {
    return this.isUp() && this.load() < cap;
  }

  /** Whether it is taking messages: healthy or busy. */
  public isUp(): boolean {
    switch (this.status.kind) {
      case "healthy":
      case "busy":
        return true;
      case "down":
      case "restarting":
        return false;
      default:
        return assertNever(this.status);
    }
  }

  /** Whether it holds nothing and is healthy. */
  public isIdle(): boolean {
    return this.status.kind === "healthy" && this.load() === 0;
  }

  /** The broker dealt it a message, now on its way. */
  public expect(): void {
    this.incoming += 1;
  }

  /** A dealt message arrives; a service that went down meanwhile bounces it. */
  public receive(id: number, now: number): Delivery {
    if (this.incoming <= 0) {
      throw new Error(`Service received message ${id} it was never dealt`);
    }
    this.incoming -= 1;
    if (!this.isUp()) {
      return "bounced";
    }
    this.waiting.push(id);
    this.startWork(now);
    return "accepted";
  }

  /** Advances the service to `now` and reports what changed. */
  public step(now: number): readonly ServiceChange[] {
    switch (this.status.kind) {
      case "healthy":
      case "busy":
        return this.work(now, this.status);
      case "down":
        return now - this.status.since >= this.rules.downMs ? this.beginRestart(now) : [];
      case "restarting":
        return now - this.status.since >= this.rules.restartMs ? this.recover() : [];
      default:
        return assertNever(this.status);
    }
  }

  /** How the view draws it. */
  public view(): ServiceView {
    return {
      status: this.status,
      held: this.jobs.length + this.waiting.length,
      incoming: this.incoming,
      processed: this.processed,
      restarts: this.restarts,
    };
  }

  private work(now: number, status: ServiceStatus): readonly ServiceChange[] {
    const changes: ServiceChange[] = [];
    for (let index = this.jobs.length - 1; index >= 0; index -= 1) {
      const job = this.jobs[index];
      if (job.doneAt <= now) {
        this.jobs.splice(index, 1);
        this.processed += 1;
        changes.push({ kind: "completed", id: job.id });
      }
    }
    this.startWork(now);

    const over = this.load() > this.rules.limit;
    if (status.kind === "healthy" && over) {
      this.status = { kind: "busy", since: now };
      changes.push({ kind: "strained" });
    } else if (status.kind === "busy" && !over) {
      this.status = HEALTHY;
      changes.push({ kind: "relieved" });
    } else if (status.kind === "busy" && now - status.since >= this.rules.overloadMs) {
      changes.push(this.crash(now));
    }
    return changes;
  }

  private startWork(now: number): void {
    while (this.jobs.length < this.rules.workers && this.waiting.length > 0) {
      const id = this.waiting.shift() as number;
      this.jobs.push({ id, doneAt: now + jittered(this.random, this.profile.workMs, this.rules.workJitter) });
    }
  }

  private crash(now: number): ServiceChange {
    const returned = [...this.jobs.map((job) => job.id), ...this.waiting];
    this.jobs.length = 0;
    this.waiting.length = 0;
    this.status = { kind: "down", since: now };
    return { kind: "down", returned };
  }

  private beginRestart(now: number): readonly ServiceChange[] {
    this.status = { kind: "restarting", since: now };
    this.restarts += 1;
    return [{ kind: "restarting" }];
  }

  private recover(): readonly ServiceChange[] {
    this.status = HEALTHY;
    return [{ kind: "recovered" }];
  }
}
