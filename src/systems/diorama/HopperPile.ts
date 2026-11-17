/** Where one waiting message sits in the hopper: its column and how many parcels are under it. */
export type PileSlot = Readonly<{ id: number; column: number; level: number }>;

/**
 * The waiting messages piled up in the broker's hopper, as stacks in a few columns. A parcel keeps its
 * column while it waits: a new one drops onto the lowest stack (the middle columns first when stacks tie),
 * and when one is dealt the parcels above it settle down a level. Once every column is full, the rest wait
 * out of sight and are counted, to be shown as "+N"; they drop in as room opens up. Pure: fed the queue's
 * ids on each sync.
 */
export class HopperPile {
  private readonly stacks: number[][];
  private readonly unseen: number[] = [];
  private readonly fillOrder: readonly number[];

  /** `order` lists the columns from the one filled first to the one filled last, among stacks that tie. */
  public constructor(
    private readonly levels: number,
    order: readonly number[],
  ) {
    const columns = order.length;
    if (!Number.isInteger(levels) || levels < 1 || columns < 1) {
      throw new Error(`A pile needs at least one column and one level: ${columns} × ${levels}`);
    }
    if (new Set(order).size !== columns || order.some((column) => !Number.isInteger(column) || column < 0 || column >= columns)) {
      throw new Error(`The fill order must name every column once: ${order.join(", ")}`);
    }
    this.fillOrder = order;
    this.stacks = order.map(() => []);
  }

  /** The most parcels the pile shows. */
  public capacity(): number {
    return this.stacks.length * this.levels;
  }

  /** Brings the pile in line with the queue: `ids` are the waiting messages, head (oldest) first. */
  public sync(ids: readonly number[]): void {
    const waiting = new Set(ids);
    this.stacks.forEach((stack, column) => {
      this.stacks[column] = stack.filter((id) => waiting.has(id));
    });
    const kept = this.unseen.filter((id) => waiting.has(id));
    const known = new Set([...kept, ...this.stacks.flat()]);
    this.unseen.splice(0, this.unseen.length, ...kept, ...ids.filter((id) => !known.has(id)));
    while (this.unseen.length > 0) {
      const column = this.lowest();
      if (column === undefined) {
        break;
      }
      this.stacks[column].push(this.unseen.shift() as number);
    }
  }

  /** Every parcel in the pile, column by column from the bottom up. */
  public slots(): readonly PileSlot[] {
    return this.stacks.flatMap((stack, column) => stack.map((id, level) => ({ id, column, level })));
  }

  /** How many waiting messages the pile has no room to show. */
  public overflow(): number {
    return this.unseen.length;
  }

  /** The lowest column with room, by the fill order on a tie; undefined when all are full. */
  private lowest(): number | undefined {
    let best: number | undefined;
    for (const column of this.fillOrder) {
      const height = this.stacks[column].length;
      if (height < this.levels && (best === undefined || height < this.stacks[best].length)) {
        best = column;
      }
    }
    return best;
  }
}
