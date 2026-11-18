/**
 * Product's inbox: ideas the visitor dropped in, waiting for a free spot on the floor. It holds at most
 * `limit`; past that a drop is turned away. The tray draws only the first few; `overflow` says how many
 * more the "+N" tag stands for.
 */
export class IdeaQueue {
  private waiting = 0;

  public constructor(private readonly limit: number) {
    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error(`An inbox holds at least one idea: ${limit}`);
    }
  }

  /** Drops an idea in; false when the inbox is full and it was turned away. */
  public drop(): boolean {
    if (this.waiting >= this.limit) {
      return false;
    }
    this.waiting += 1;
    return true;
  }

  /** Takes the oldest idea out to start it; false when there is none. */
  public take(): boolean {
    if (this.waiting === 0) {
      return false;
    }
    this.waiting -= 1;
    return true;
  }

  /** How many ideas wait. */
  public count(): number {
    return this.waiting;
  }

  /** Whether none wait. */
  public empty(): boolean {
    return this.waiting === 0;
  }

  /** How many wait beyond the `shown` the tray draws. */
  public overflow(shown: number): number {
    return Math.max(0, this.waiting - shown);
  }
}
