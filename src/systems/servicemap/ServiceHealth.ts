/** How a service is doing, as its card shows it. */
export type HealthPhase = "up" | "down" | "recovering";

type State = Readonly<{ kind: "up" }> | Readonly<{ kind: "down"; since: number }> | Readonly<{ kind: "recovering" }>;

/**
 * One service's health. Taken down, it stays down for `downMs`, then restarts and answers again, but it only
 * counts as back once the gateway trusts it: `recover()` is called when its breaker closes.
 */
export class ServiceHealth {
  private state: State = { kind: "up" };

  public constructor(private readonly downMs: number) {
    if (!(downMs > 0) || !Number.isFinite(downMs)) {
      throw new Error(`A service must stay down for some time: ${downMs}`);
    }
  }

  public phase(): HealthPhase {
    return this.state.kind;
  }

  /** Whether it answers requests: up, or restarted and waiting to be trusted. */
  public answers(): boolean {
    return this.state.kind !== "down";
  }

  /** Takes it down at `now`; a service that is not up cannot be taken down again. Says whether it went down. */
  public takeDown(now: number): boolean {
    if (this.state.kind !== "up") {
      return false;
    }
    this.state = { kind: "down", since: now };
    return true;
  }

  /** Lets time pass; says whether it restarted. */
  public update(now: number): boolean {
    if (this.state.kind === "down" && now - this.state.since >= this.downMs) {
      this.state = { kind: "recovering" };
      return true;
    }
    return false;
  }

  /** The gateway trusts it again; says whether it was recovering. */
  public recover(): boolean {
    if (this.state.kind !== "recovering") {
      return false;
    }
    this.state = { kind: "up" };
    return true;
  }
}
