/** How far apart the floating card's layers sit, in card units. */
export type SpreadRules = Readonly<{
  layers: number;
  /** The distance between neighbouring layers when the card is one card, and when it is open. */
  closedGap: number;
  openGap: number;
}>;

/**
 * The floating card's layers spread apart: every gap grows from closed to open with the card's openness, and
 * the stack stays centred on the card's anchor, so it breathes in place rather than climbing. Openness above
 * 1 opens it wider still, for the pop when it is clicked.
 */
export class CardSpread {
  public constructor(private readonly rules: SpreadRules) {
    if (!Number.isInteger(rules.layers) || rules.layers < 2) {
      throw new Error(`A card needs at least two layers: ${rules.layers}`);
    }
    if (!(rules.closedGap > 0) || !(rules.openGap > rules.closedGap)) {
      throw new Error(`The open gap must be wider than the closed one, and both above zero`);
    }
  }

  /** How many layers there are. */
  public layers(): number {
    return this.rules.layers;
  }

  /** The height of layer `layer`'s base above the anchor (negative: below it) at `openness`, 0 closed, 1 open. */
  public lift(layer: number, openness: number): number {
    const gap = this.gap(openness);
    return (layer - (this.rules.layers - 1) / 2) * gap;
  }

  /** The distance between neighbouring layers at `openness`; never closer than closed. */
  public gap(openness: number): number {
    return this.rules.closedGap + (this.rules.openGap - this.rules.closedGap) * Math.max(0, openness);
  }
}
