import { jittered, type RandomSource } from "../queue/RandomSource";

/**
 * A stream of dots at a rate that can change from step to step, each gap varied by up to `jitter` either
 * way so the flow never looks mechanical. Fed time in steps, it says how many dots leave in each.
 */
export class Emitter {
  private untilNext = 0;

  public constructor(
    private readonly random: RandomSource,
    private readonly jitter: number,
  ) {
    if (!(jitter >= 0 && jitter < 1)) {
      throw new Error(`Jitter is a share below one: ${jitter}`);
    }
  }

  /** Lets `ms` pass at `perSecond`; returns how many dots leave. A rate of zero holds the stream. */
  public advance(ms: number, perSecond: number): number {
    if (!(perSecond > 0)) {
      return 0;
    }
    this.untilNext -= ms;
    let count = 0;
    while (this.untilNext <= 0) {
      count += 1;
      this.untilNext += jittered(this.random, 1000 / perSecond, this.jitter);
    }
    return count;
  }
}
