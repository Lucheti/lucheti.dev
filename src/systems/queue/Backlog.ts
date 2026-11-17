type Entry = Readonly<{ id: number; readyAt: number }>;

/** The queue itself: messages in arrival order, each resting a moment before it can be dealt. */
export class Backlog {
  private readonly entries: Entry[] = [];

  public constructor(private readonly dwellMs: number) {
    if (!(dwellMs >= 0)) {
      throw new Error(`Dwell time cannot be negative: ${dwellMs}`);
    }
  }

  /** Puts message `id` at the back of the queue at `now`. */
  public push(id: number, now: number): void {
    this.entries.push({ id, readyAt: now + this.dwellMs });
  }

  /** Whether the head of the queue has rested long enough to be dealt at `now`. */
  public hasReady(now: number): boolean {
    return this.entries.length > 0 && this.entries[0].readyAt <= now;
  }

  /** Takes the head of the queue. */
  public take(): number {
    const entry = this.entries.shift();
    if (entry === undefined) {
      throw new Error("Took from an empty queue");
    }
    return entry.id;
  }

  /** How many messages wait. */
  public depth(): number {
    return this.entries.length;
  }

  /** The waiting ids, head first. */
  public ids(): readonly number[] {
    return this.entries.map((entry) => entry.id);
  }
}
