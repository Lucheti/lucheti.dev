import { smoothstep } from "../layers/easing";

/** The pace and reach of the island's small life. Lengths in seconds, distances in island units, angles in radians. */
export type IdleRules = Readonly<{
  /** How many puffs of steam there are, how long one takes to rise and fade, how high it rises. */
  puffs: number;
  steamSeconds: number;
  steamRise: number;
  /** The plants' sway: one cycle's length and its reach. */
  swaySeconds: number;
  sway: number;
  /** The duck's bob. */
  bobSeconds: number;
  bob: number;
  /** One full breath of the floating card: closed, opening, open, closing. */
  breatheSeconds: number;
  /** How long the cloud takes to cross the window. */
  cloudSeconds: number;
  /** How often a new task arrives on the screen. */
  arrivalSeconds: number;
}>;

/** One puff of steam: how high it has risen, how big it is (0 gone, 1 full), and how far it has drifted sideways. */
export type Puff = Readonly<{ rise: number; size: number; drift: number }>;

/** The cloud: how far across the pane it is (0 to 1), and how big (it grows in and shrinks out at the edges). */
export type CloudPass = Readonly<{ across: number; size: number }>;

function fraction(value: number): number {
  return ((value % 1) + 1) % 1;
}

/**
 * The island's idle life as pure functions of time: steam rising off the mug, the plants swaying, the duck
 * bobbing, the floating card breathing apart and back, the cloud drifting past the window, and new tasks
 * arriving on the screen. Calm, slow and out of step with one another, so nothing ticks in time.
 */
export class IdleLoops {
  public constructor(private readonly rules: IdleRules) {
    const lengths = [rules.steamSeconds, rules.swaySeconds, rules.bobSeconds, rules.breatheSeconds, rules.cloudSeconds, rules.arrivalSeconds];
    if (!(rules.puffs >= 1) || lengths.some((seconds) => !(seconds > 0))) {
      throw new Error(`Idle loops need at least one puff and lengths above zero`);
    }
  }

  /** How many puffs of steam there are. */
  public puffs(): number {
    return this.rules.puffs;
  }

  /** Puff `puff` at `seconds`: the puffs follow one another evenly, each rising, swelling and fading out. */
  public steam(puff: number, seconds: number): Puff {
    const phase = fraction(seconds / this.rules.steamSeconds + puff / this.rules.puffs);
    return {
      rise: phase * this.rules.steamRise,
      size: Math.pow(Math.sin(Math.PI * phase), 0.7),
      drift: Math.sin(phase * Math.PI * 2 + puff * 2.1) * 0.035,
    };
  }

  /** A plant's lean at `seconds`; `offset` puts plants out of step with each other. Within ±`sway`. */
  public sway(seconds: number, offset: number): number {
    const slow = Math.sin((2 * Math.PI * seconds) / this.rules.swaySeconds + offset);
    const quick = Math.sin((2 * Math.PI * seconds) / (this.rules.swaySeconds * 0.43) + offset * 2.3);
    return this.rules.sway * (slow * 0.72 + quick * 0.28);
  }

  /** The duck's height above its spot at `seconds`, within ±`bob`. */
  public bob(seconds: number): number {
    return this.rules.bob * Math.sin((2 * Math.PI * seconds) / this.rules.bobSeconds);
  }

  /** How far open the floating card is at `seconds`, 0 (one card) to 1 (its layers apart), with holds at both ends. */
  public breathe(seconds: number): number {
    const phase = fraction(seconds / this.rules.breatheSeconds);
    return smoothstep(0.12, 0.42, phase) * (1 - smoothstep(0.62, 0.92, phase));
  }

  /** Where the cloud is at `seconds`. */
  public cloud(seconds: number): CloudPass {
    const across = fraction(seconds / this.rules.cloudSeconds);
    return { across, size: smoothstep(0, 0.14, across) * (1 - smoothstep(0.86, 1, across)) };
  }

  /** How many tasks have arrived by `seconds`. */
  public arrivals(seconds: number): number {
    return Math.max(0, Math.floor(seconds / this.rules.arrivalSeconds));
  }
}
