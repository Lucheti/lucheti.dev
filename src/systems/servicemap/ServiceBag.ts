import type { RandomSource } from "../queue/RandomSource";
import type { ServiceId } from "./topology";

/**
 * Which service the next request is for: a shuffled bag holding each service as often as its share of the
 * traffic, refilled when empty. Shares hold over every bag, and no service waits long for its next request,
 * so a downed service soon gets one to fail.
 */
export class ServiceBag {
  private readonly bag: ServiceId[] = [];

  public constructor(
    private readonly weights: Readonly<Record<ServiceId, number>>,
    private readonly random: RandomSource,
  ) {
    const counts = Object.values(weights);
    if (!counts.every((count) => Number.isInteger(count) && count >= 1)) {
      throw new Error(`Every service needs a whole share of one or more: ${JSON.stringify(weights)}`);
    }
  }

  /** The service the next request goes to. */
  public next(): ServiceId {
    if (this.bag.length === 0) {
      this.refill();
    }
    const service = this.bag.pop();
    if (service === undefined) {
      throw new Error("A refilled bag is never empty");
    }
    return service;
  }

  /** The share of the traffic a service gets, from 0 to 1. */
  public share(service: ServiceId): number {
    const total = Object.values(this.weights).reduce((sum, count) => sum + count, 0);
    return this.weights[service] / total;
  }

  private refill(): void {
    for (const [service, count] of Object.entries(this.weights) as [ServiceId, number][]) {
      for (let i = 0; i < count; i += 1) {
        this.bag.push(service);
      }
    }
    for (let i = this.bag.length - 1; i > 0; i -= 1) {
      const j = Math.floor(this.random.next() * (i + 1));
      [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
    }
  }
}
