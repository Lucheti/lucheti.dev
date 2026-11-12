import type { SagaSequencer } from "./SagaSequencer";

export interface PlaybackListener {
  onTick(sequencer: SagaSequencer, timeMs: number): void;
  onEnd(sequencer: SagaSequencer): void;
}

/** Drives one sequencer with requestAnimationFrame. Only one run plays at a time. */
export class SagaPlayback {
  private frameId: number | null = null;
  private sequencer: SagaSequencer | null = null;
  private startedAt: number | null = null;

  public constructor(private readonly listener: PlaybackListener) {}

  public play(sequencer: SagaSequencer): void {
    this.stop();
    this.sequencer = sequencer;
    this.startedAt = null;
    this.frameId = requestAnimationFrame(this.tick);
  }

  public stop(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
    }
    this.frameId = null;
    this.sequencer = null;
  }

  private readonly tick = (now: number): void => {
    const sequencer = this.sequencer;
    if (sequencer === null) {
      return;
    }
    this.startedAt ??= now;
    const elapsed = now - this.startedAt;
    if (elapsed >= sequencer.durationMs) {
      this.listener.onTick(sequencer, sequencer.durationMs);
      this.frameId = null;
      this.sequencer = null;
      this.listener.onEnd(sequencer);
      return;
    }
    this.listener.onTick(sequencer, elapsed);
    this.frameId = requestAnimationFrame(this.tick);
  };
}
