import type { Seconds } from "./Seconds";
import type { Waker } from "./Switchboard";

/** What a big button sets off when it is pressed. */
export interface Trigger {
  fire(): void;
}

/**
 * An island's big orange button, from the 3D cap and its hidden HTML twin alike: a press sets off its
 * trigger, and is remembered so the cap can play its squash (and anything near it a pulse) as curves of
 * the press's age.
 */
export class BigButton {
  private pressedAt = Number.NEGATIVE_INFINITY;

  public constructor(
    private readonly trigger: Trigger,
    private readonly clock: Seconds,
    private readonly waker: Waker,
  ) {}

  /** The visitor pressed it. */
  public press(): void {
    this.trigger.fire();
    this.pressedAt = this.clock.now();
    this.waker.wake();
  }

  /** Seconds since the last press; infinite if it never was. */
  public age(): number {
    return this.clock.now() - this.pressedAt;
  }
}
