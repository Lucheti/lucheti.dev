/** Where the big button is at one moment of a press: how far in, and how it is squashed. */
export type PressPose = Readonly<{
  /** How far the cap is pushed in: 0 at rest, 1 fully in, below 0 when it springs back past rest. */
  depth: number;
  /** The cap's height as a share of its rest height. */
  tall: number;
  /** The cap's width as a share of its rest width. */
  wide: number;
}>;

/** The shape of a press. */
export type PressRules = Readonly<{
  /** Seconds the cap takes to go all the way in. */
  push: number;
  /** Seconds it stays in. */
  hold: number;
  /** How fast the release springs, in swings per second, and how fast it dies away, per second. */
  frequency: number;
  decay: number;
  /** How much shorter the cap gets when fully in, as a share of its height. */
  squash: number;
}>;

const REST: PressPose = { depth: 0, tall: 1, wide: 1 };
/** Below this the release has died away for good. */
const SETTLED = 0.002;

/**
 * The big button's press as a pure function of its age (seconds since it was pressed): it plunges in
 * fast and squashes flat, holds for a beat, then is let go and springs back up past its rest, a little
 * stretched, before settling. Volume is roughly kept: as it gets shorter it gets wider.
 */
export class ButtonPress {
  private readonly length: number;

  public constructor(private readonly rules: PressRules) {
    if (!(rules.push > 0) || !(rules.hold >= 0) || !(rules.frequency > 0) || !(rules.decay > 0)) {
      throw new Error("A press needs a push and a spring above zero, and a hold that is not negative");
    }
    if (!(rules.squash >= 0 && rules.squash < 1)) {
      throw new Error(`A squash is a share below one: ${rules.squash}`);
    }
    this.length = rules.push + rules.hold + Math.log(1 / SETTLED) / rules.decay;
  }

  /** The pose `age` seconds after the press; at rest before it and once it has settled. */
  public at(age: number): PressPose {
    if (!Number.isFinite(age) || age < 0 || age >= this.length) {
      return REST;
    }
    const { push, hold } = this.rules;
    if (age < push) {
      const t = age / push;
      return this.posed(1 - (1 - t) * (1 - t));
    }
    if (age < push + hold) {
      return this.posed(1);
    }
    const t = age - push - hold;
    return this.posed(Math.exp(-this.rules.decay * t) * Math.cos(2 * Math.PI * this.rules.frequency * t));
  }

  /** Whether a press `age` seconds old has settled. */
  public settled(age: number): boolean {
    return !Number.isFinite(age) || age < 0 || age >= this.length;
  }

  private posed(depth: number): PressPose {
    const squash = this.rules.squash * depth;
    return { depth, tall: 1 - squash, wide: 1 + squash * 0.5 };
  }
}
