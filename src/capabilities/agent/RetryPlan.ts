import { SeededRandom } from "./SeededRandom";

/** Episodes come in blocks of this many, and exactly one in each block has a failing test. */
const BLOCK_SIZE = 4;

/**
 * Which tickets hit a failing test first: one in every four, at a seeded place in its block of four,
 * so "about one loop in four" holds over any minute of watching. The very first ticket always goes
 * cleanly. Every block has the same length, which keeps the timeline periodic.
 */
export class RetryPlan {
  public constructor(private readonly seed: number) {
    if (!Number.isInteger(seed)) {
      throw new Error(`A retry plan needs a whole seed, not ${seed}`);
    }
  }

  /** How many episodes make one block. */
  public blockSize(): number {
    return BLOCK_SIZE;
  }

  /** Whether episode `episode` (0, 1, 2 …) fails a test and goes back to fix it. */
  public retries(episode: number): boolean {
    if (!Number.isInteger(episode) || episode < 0) {
      throw new Error(`Episodes are counted from 0, not ${episode}`);
    }
    const block = Math.floor(episode / BLOCK_SIZE);
    return episode % BLOCK_SIZE === this.slotIn(block);
  }

  /** The place, inside block `block`, of its one retry. */
  private slotIn(block: number): number {
    const random = new SeededRandom(this.seed + block * 7919);
    return block === 0 ? random.int(1, BLOCK_SIZE - 1) : random.int(0, BLOCK_SIZE - 1);
  }
}
