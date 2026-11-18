import { assertNever } from "../queue/assertNever";

/** Where a breaker stands, as the map draws it. */
export type BreakerPhase = "closed" | "open" | "half-open";

/** How a breaker trips and heals. Times in ms. */
export type BreakerPolicy = Readonly<{
  /** Failures in a row that open it. */
  threshold: number;
  /** How long it stays open before it lets test requests through. */
  openMs: number;
  /** Test requests that must pass, in a row, to close it again. */
  probesToClose: number;
}>;

type State =
  | Readonly<{ kind: "closed"; failures: number }>
  | Readonly<{ kind: "open"; since: number }>
  | Readonly<{ kind: "half-open"; passed: number }>;

/** What changed when the breaker was told something. */
export type BreakerChange = "opened" | "half-opened" | "closed" | null;

/**
 * The gateway's circuit breaker on one service's edge. Closed, it lets every request through and counts
 * failures in a row; at the threshold it opens and fails requests fast. After a while open it goes half-open
 * and lets a few test requests through: enough of them passing closes it, one failing opens it again.
 */
export class CircuitBreaker {
  private state: State = { kind: "closed", failures: 0 };

  public constructor(private readonly policy: BreakerPolicy) {
    const { threshold, openMs, probesToClose } = policy;
    if (!Number.isInteger(threshold) || threshold < 1 || !Number.isInteger(probesToClose) || probesToClose < 1) {
      throw new Error(`A breaker needs at least one failure to open and one test to close: ${JSON.stringify(policy)}`);
    }
    if (!(openMs > 0) || !Number.isFinite(openMs)) {
      throw new Error(`A breaker must stay open for some time: ${openMs}`);
    }
  }

  /** Where it stands. */
  public phase(): BreakerPhase {
    return this.state.kind;
  }

  /** Whether an ordinary request may pass now; when not, the gateway fails it fast. */
  public admits(): boolean {
    return this.state.kind === "closed";
  }

  /** Whether the gateway should be sending test requests. */
  public probing(): boolean {
    return this.state.kind === "half-open";
  }

  /** Lets time pass: an open breaker goes half-open once it has waited long enough. */
  public update(now: number): BreakerChange {
    if (this.state.kind === "open" && now - this.state.since >= this.policy.openMs) {
      this.state = { kind: "half-open", passed: 0 };
      return "half-opened";
    }
    return null;
  }

  /** A request (or test request) through it failed at `now`. */
  public fail(now: number): BreakerChange {
    switch (this.state.kind) {
      case "closed": {
        const failures = this.state.failures + 1;
        if (failures >= this.policy.threshold) {
          this.state = { kind: "open", since: now };
          return "opened";
        }
        this.state = { kind: "closed", failures };
        return null;
      }
      case "half-open":
        this.state = { kind: "open", since: now };
        return "opened";
      case "open":
        return null;
      default:
        return assertNever(this.state);
    }
  }

  /** A request (or test request) through it came back fine. */
  public pass(): BreakerChange {
    switch (this.state.kind) {
      case "closed":
        this.state = { kind: "closed", failures: 0 };
        return null;
      case "half-open": {
        const passed = this.state.passed + 1;
        if (passed >= this.policy.probesToClose) {
          this.state = { kind: "closed", failures: 0 };
          return "closed";
        }
        this.state = { kind: "half-open", passed };
        return null;
      }
      case "open":
        return null;
      default:
        return assertNever(this.state);
    }
  }
}
