import { Progress } from "@/story";
import type { Signal, Unsubscribe } from "@/story";

/** A page progress that never moves; the reduced-motion player rests here. */
export class StillProgress implements Signal<Progress> {
  private readonly progress: Progress;

  public constructor(fraction: number) {
    this.progress = Progress.of(fraction);
  }

  public current(): Progress {
    return this.progress;
  }

  public subscribe(): Unsubscribe {
    return () => undefined;
  }
}
