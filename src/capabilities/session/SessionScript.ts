import type { ScriptEntry } from "./entries";
import type { SessionCue, StreamRow, TimedCue } from "./stream";

/**
 * One run of the agent laid out in time: its rows, each appearing at its moment and changing until its end,
 * and the cues they set off. It is a pure function of time: `rowsAt(t)` is the stream at `t` ms into the
 * run, and `cuesBetween` the cues that fell in a stretch of it.
 */
export class SessionScript {
  private readonly total: number;
  private readonly timedCues: readonly TimedCue[];

  public constructor(private readonly entries: readonly ScriptEntry[]) {
    if (entries.length === 0) {
      throw new Error("A run needs at least one row");
    }
    entries.forEach((entry, index) => {
      if (index > 0 && entry.at < entries[index - 1].at) {
        throw new Error(`Rows appear in order: row ${index} at ${entry.at} comes before ${entries[index - 1].at}`);
      }
    });
    this.total = Math.max(...entries.map((entry) => entry.end));
    this.timedCues = entries.flatMap((entry) => entry.cues()).toSorted((a, b) => a.at - b.at);
  }

  /** How long the run takes, until its last row stops changing, in ms. */
  public duration(): number {
    return this.total;
  }

  /** The stream at `time` ms into the run: every row that has appeared, as it looks then. */
  public rowsAt(time: number): readonly StreamRow[] {
    return this.visibleAt(time).map((entry) => entry.rowAt(time));
  }

  /** A key that changes whenever the stream's look does. */
  public stageKeyAt(time: number): string {
    return this.visibleAt(time)
      .map((entry) => entry.stageAt(time))
      .join(".");
  }

  /** Whether the agent is still at work at `time`. */
  public runningAt(time: number): boolean {
    return time < this.total;
  }

  /** The cues that fell after `from` and up to `to`, in order. */
  public cuesBetween(from: number, to: number): readonly SessionCue[] {
    return this.timedCues.filter(({ at }) => at > from && at <= to).map(({ cue }) => cue);
  }

  private visibleAt(time: number): readonly ScriptEntry[] {
    return this.entries.filter((entry) => entry.at <= time);
  }
}
