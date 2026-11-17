import { easeInOutCubic } from "../layers/easing";

/** When and how far the floating cards come apart, in scroll progress and card units. */
export type ExplodeRules = Readonly<{
  /** How many cards, and how many layers each has. */
  cards: number;
  layers: number;
  /** The progress window in which the first card opens, top gap starting at `from`, bottom gap done at `to`. */
  from: number;
  to: number;
  /** How much later each card starts than the one before it. */
  cardStagger: number;
  /** How much later each gap starts than the one above it. */
  gapStagger: number;
  /** The distance between neighbouring layers, closed and open. */
  closedGap: number;
  openGap: number;
}>;

/**
 * The floating cards' explode, as a pure function of scroll progress: each card opens from a tight stack into
 * its layers while the camera dollies in, one card after another, the top gap of each a little before the
 * gaps under it. It stays open after that, and closes again when scrolled back.
 *
 * Owns the rules that a gap stays between its closed and open sizes, so layers never pass through one
 * another; that each stack stays centred on its card's anchor; and that every card is fully open by the end
 * of its window.
 */
export class ExplodeTiming {
  private readonly span: number;

  public constructor(private readonly rules: ExplodeRules) {
    const { cards, layers, from, to, cardStagger, gapStagger, closedGap, openGap } = rules;
    if (!Number.isInteger(cards) || cards < 1 || !Number.isInteger(layers) || layers < 2) {
      throw new Error(`At least one card of at least two layers: ${cards} × ${layers}`);
    }
    if (!(closedGap > 0) || !(openGap > closedGap)) {
      throw new Error(`The open gap must be wider than the closed one, and both above zero`);
    }
    if (!(gapStagger >= 0) || !(cardStagger >= 0)) {
      throw new Error(`Staggers cannot be negative`);
    }
    this.span = to - from - (layers - 2) * gapStagger;
    if (!(from >= 0) || !(this.span > 0) || !(to + (cards - 1) * cardStagger <= 1)) {
      throw new Error(`Every card's window must fit inside 0…1 and outlast its stagger`);
    }
  }

  /** How many cards there are. */
  public cards(): number {
    return this.rules.cards;
  }

  /** How open gap `gap` of card `card` is at progress `p`, eased, 0 closed to 1 open. Gap 1 sits on the bottom layer. */
  public opening(card: number, gap: number, p: number): number {
    const { from, cardStagger, gapStagger, layers } = this.rules;
    const start = from + card * cardStagger + (layers - 1 - gap) * gapStagger;
    return easeInOutCubic((p - start) / this.span);
  }

  /** The height of layer `layer`'s base above the card's anchor (or below it), with the stack centred on the anchor. */
  public lift(card: number, layer: number, p: number): number {
    const { layers, closedGap, openGap } = this.rules;
    let height = 0;
    let total = 0;
    for (let gap = 1; gap < layers; gap += 1) {
      total += closedGap + (openGap - closedGap) * this.opening(card, gap, p);
      if (gap === layer) {
        height = total;
      }
    }
    return height - total / 2;
  }
}
