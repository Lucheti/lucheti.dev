import { jittered, type RandomSource } from "./RandomSource";
import type { QueueConfig } from "./types";

/**
 * The service that publishes messages: a steady, slightly irregular flow, plus whatever the visitor
 * sends, which leaves in a quick stream rather than all at once.
 */
export class Producer {
  private nextSteadyAt: number;
  private nextSentAt: number;
  private pending = 0;
  private flowing = true;

  public constructor(
    private readonly arrival: QueueConfig["arrival"],
    private readonly burst: QueueConfig["burst"],
    private readonly random: RandomSource,
    start: number,
  ) {
    if (!(arrival.meanGapMs > 0) || !(burst.gapMs > 0)) {
      throw new Error("Message gaps must be positive");
    }
    if (arrival.jitter < 0 || arrival.jitter >= 1) {
      throw new Error(`Arrival jitter must be in [0, 1): ${arrival.jitter}`);
    }
    this.nextSteadyAt = start + this.gap();
    this.nextSentAt = start;
  }

  /** Messages the visitor sent that have not left yet. */
  public waiting(): number {
    return this.pending;
  }

  /** Queues `count` messages to send, starting now if none are waiting. */
  public send(count: number, now: number): void {
    if (this.pending === 0) {
      this.nextSentAt = Math.max(this.nextSentAt, now);
    }
    this.pending += count;
  }

  /** Stops the steady flow; sent messages still leave. */
  public hold(): void {
    this.flowing = false;
  }

  /** Starts the steady flow again, the next message one gap from `now`. */
  public resume(now: number): void {
    if (!this.flowing) {
      this.flowing = true;
      this.nextSteadyAt = now + this.gap();
    }
  }

  /** How many messages leave at `now`. */
  public step(now: number): number {
    let leaving = 0;
    if (this.flowing) {
      while (now >= this.nextSteadyAt) {
        leaving += 1;
        this.nextSteadyAt += this.gap();
      }
    }
    if (this.pending > 0 && now >= this.nextSentAt) {
      leaving += 1;
      this.pending -= 1;
      this.nextSentAt = now + this.burst.gapMs;
    }
    return leaving;
  }

  private gap(): number {
    return jittered(this.random, this.arrival.meanGapMs, this.arrival.jitter);
  }
}
