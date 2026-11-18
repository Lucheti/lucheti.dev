import type { Trigger } from "./kit";

/** Sends a batch of messages. */
export interface Sender {
  send(count: number): void;
}

/** What the queue's big button sets off: a batch of `count` messages into the queue. */
export class SendBatch implements Trigger {
  public constructor(
    private readonly sender: Sender,
    private readonly count: number,
  ) {
    if (!Number.isInteger(count) || count < 1) {
      throw new Error(`The button sends at least one message: ${count}`);
    }
  }

  public fire(): void {
    this.sender.send(this.count);
  }
}
