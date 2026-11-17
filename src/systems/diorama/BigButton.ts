import type { Waker } from "./kit";

/** Seconds from some fixed moment, only ever growing. */
export interface Seconds {
  now(): number;
}

/** The browser's high-resolution clock, in seconds. */
export class BrowserSeconds implements Seconds {
  public now(): number {
    return performance.now() / 1000;
  }
}

/** Sends a batch of messages. */
export interface Sender {
  send(count: number): void;
}

/**
 * The big orange button, from the 3D cap and its hidden HTML twin alike: a press sends the batch, and is
 * remembered so the cap can play its squash and the kiosk its pulse as curves of the press's age.
 */
export class BigButton {
  private pressedAt = Number.NEGATIVE_INFINITY;

  public constructor(
    private readonly sender: Sender,
    private readonly count: number,
    private readonly clock: Seconds,
    private readonly waker: Waker,
  ) {
    if (!Number.isInteger(count) || count < 1) {
      throw new Error(`The button sends at least one message: ${count}`);
    }
  }

  /** The visitor pressed it. */
  public press(): void {
    this.sender.send(this.count);
    this.pressedAt = this.clock.now();
    this.waker.wake();
  }

  /** Seconds since the last press; infinite if it never was. */
  public age(): number {
    return this.clock.now() - this.pressedAt;
  }
}
