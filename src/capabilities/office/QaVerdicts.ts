/** A source of floats in [0, 1). */
export interface Chance {
  next(): number;
}

/**
 * QA's verdicts, drawn in turn from a seeded source so the office plays the same way every time: each
 * ticket is sent back once with the given chance (about one in four), or passes first time.
 */
export class QaVerdicts {
  public constructor(
    private readonly chance: Chance,
    private readonly sendBack: number,
  ) {
    if (!(sendBack >= 0 && sendBack <= 1)) {
      throw new Error(`A chance is a share from 0 to 1: ${sendBack}`);
    }
  }

  /** How many times QA sends the next ticket back. */
  public bounces(): number {
    return this.chance.next() < this.sendBack ? 1 : 0;
  }
}
