/** How much the room breathes when nobody is scrolling. */
export type IdleRules = Readonly<{
  /** How far a card bobs up and down, in metres, and one bob's length in seconds. */
  bob: number;
  bobSeconds: number;
  /** How far a card rocks either side, in radians. */
  rock: number;
  /** How far the lamp's brightness wavers either side of its level, as a share of it. */
  flicker: number;
}>;

/** Each card bobs out of step with the others by this share of a bob. */
const CARD_PHASE = 0.37;

/**
 * The room's small life, as pure functions of time in seconds: the floating cards bob and rock gently, each
 * out of step with the others, and the desk lamp wavers so little you feel it more than see it. Every value
 * stays within its stated reach.
 */
export class IdleMotion {
  public constructor(private readonly rules: IdleRules) {
    if (!(rules.bobSeconds > 0) || !(rules.bob >= 0) || !(rules.rock >= 0) || !(rules.flicker >= 0 && rules.flicker < 1)) {
      throw new Error(`Idle motion needs a bob length above zero and reaches that are not negative`);
    }
  }

  /** How far card `card` has risen from its anchor at `seconds`, within ±`bob`. */
  public rise(card: number, seconds: number): number {
    return this.rules.bob * Math.sin(this.phase(card, seconds));
  }

  /** How far card `card` has rocked at `seconds`, within ±`rock`. */
  public rock(card: number, seconds: number): number {
    return this.rules.rock * Math.sin(this.phase(card, seconds) * 0.5 + card);
  }

  /** The lamp's brightness at `seconds` as a share of its level, within 1 ± `flicker`. Three slow waves out of step, so it never repeats visibly. */
  public lamp(seconds: number): number {
    const wave = Math.sin(seconds * 1.3) * 0.5 + Math.sin(seconds * 3.7 + 1.1) * 0.3 + Math.sin(seconds * 9.1 + 2.3) * 0.2;
    return 1 + this.rules.flicker * wave;
  }

  private phase(card: number, seconds: number): number {
    return ((seconds / this.rules.bobSeconds + card * CARD_PHASE) % 1) * Math.PI * 2;
  }
}
