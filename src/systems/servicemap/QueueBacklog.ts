/**
 * The NATS queue's depth: messages flow in at one rate and the consumers drain them at their capacity. When
 * more come in than they can take, the backlog grows; once the flow drops, they drain it. It never goes below
 * empty. Rates are per second, time in ms.
 */
export class QueueBacklog {
  private depth = 0;

  public constructor(private readonly full: number) {
    if (!(full > 0) || !Number.isFinite(full)) {
      throw new Error(`A queue needs a size to fill: ${full}`);
    }
  }

  /** Lets `ms` pass with messages arriving at `inflow` and drained at up to `capacity`. */
  public advance(ms: number, inflow: number, capacity: number): void {
    if (!(ms >= 0) || !Number.isFinite(ms)) {
      throw new Error(`Time only moves forward: ${ms}`);
    }
    this.depth = Math.max(0, this.depth + ((inflow - capacity) * ms) / 1000);
  }

  /** How many messages wait, rounded down. */
  public waiting(): number {
    return Math.floor(this.depth);
  }

  /** How full the bar is, from 0 to 1. */
  public fill(): number {
    return Math.min(1, this.depth / this.full);
  }
}
