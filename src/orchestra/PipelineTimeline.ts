/** The discrete things on screen at one moment of the chapter. */
export type PipelineState = Readonly<{
  /** How many principles have been revealed. */
  principles: number;
  statsShown: boolean;
  /** How many stage nodes the ticket has reached (and lit). */
  litStages: number;
  /** How many agent-log lines are revealed. */
  logLines: number;
}>;

type PipelineCounts = Readonly<{
  principles: number;
  stages: number;
  logLines: number;
}>;

const PRINCIPLES_FROM = 0.2;
const PRINCIPLES_STEP = 0.15;
const STATS_AT = 0.55;
const TOKEN_FROM = 0.15;
const TOKEN_TO = 0.95;
const LOG_FROM = 0.3;
const LOG_TO = 0.92;
/** Guards float error so a stage lights exactly when the token is on it. */
const EPSILON = 1e-9;

/**
 * Maps progress through the pinned frame to what the chapter shows.
 *
 * Pure and stateless: scrolling back un-reveals everything, because every
 * answer depends on the progress alone.
 */
export class PipelineTimeline {
  public constructor(private readonly counts: PipelineCounts) {
    if (counts.stages < 2) {
      throw new RangeError("A pipeline needs at least two stages");
    }
    if (counts.principles < 0 || counts.logLines < 0) {
      throw new RangeError("Counts cannot be negative");
    }
  }

  public static same(a: PipelineState, b: PipelineState): boolean {
    return (
      a.principles === b.principles &&
      a.statsShown === b.statsShown &&
      a.litStages === b.litStages &&
      a.logLines === b.logLines
    );
  }

  public stateAt(progress: number): PipelineState {
    return {
      principles: this.principlesAt(progress),
      statsShown: progress >= STATS_AT,
      litStages: this.litStagesAt(progress),
      logLines: this.logLinesAt(progress),
    };
  }

  /** Where the ticket is along the rail: 0 on the first stage, 1 on the last. */
  public tokenAt(progress: number): number {
    const fraction = (progress - TOKEN_FROM) / (TOKEN_TO - TOKEN_FROM);
    return Math.min(1, Math.max(0, fraction));
  }

  private principlesAt(progress: number): number {
    if (progress < PRINCIPLES_FROM - EPSILON) {
      return 0;
    }
    const passed = Math.floor((progress - PRINCIPLES_FROM) / PRINCIPLES_STEP + EPSILON) + 1;
    return Math.min(this.counts.principles, passed);
  }

  private litStagesAt(progress: number): number {
    if (progress < TOKEN_FROM) {
      return 0;
    }
    const gaps = this.counts.stages - 1;
    return Math.min(this.counts.stages, Math.floor(this.tokenAt(progress) * gaps + EPSILON) + 1);
  }

  private logLinesAt(progress: number): number {
    const { logLines } = this.counts;
    if (logLines === 0 || progress < LOG_FROM) {
      return 0;
    }
    const step = (LOG_TO - LOG_FROM) / logLines;
    return Math.min(logLines, Math.floor((progress - LOG_FROM) / step + EPSILON) + 1);
  }
}
