import type { Latency } from "./Latency";
import type { MapConfig } from "./mapConfig";
import type { QueueBacklog } from "./QueueBacklog";
import type { Spike } from "./Spike";
import { queueConsumers, SERVICES, type ServiceId } from "./topology";

/** What the traffic needs to know about the services right now. */
export interface ServiceGate {
  /** Whether the gateway lets ordinary requests through to the service. */
  admits(service: ServiceId): boolean;
  /** Whether the service is running and can take work. */
  answers(service: ServiceId): boolean;
}

/**
 * The real traffic behind the dots, as rates: requests per second at the gateway (multiplied in a spike),
 * each service's share, the requests the gateway fails fast while a breaker is not closed, each service's
 * p95, and the messages published to the queue against what its consumers drain.
 */
export class TrafficModel {
  private failed = 0;
  private readonly total: number;

  public constructor(
    private readonly config: MapConfig,
    private readonly spike: Spike,
    private readonly latencies: Readonly<Record<ServiceId, Latency>>,
    private readonly backlog: QueueBacklog,
  ) {
    this.total = SERVICES.reduce((sum, service) => sum + config.weights[service], 0);
  }

  /** Starts a spike at `now` unless one runs; says whether it started. */
  public startSpike(now: number): boolean {
    return this.spike.start(now);
  }

  public spiking(now: number): boolean {
    return this.spike.running(now);
  }

  /** How many times the steady traffic is coming in at `now`. */
  public load(now: number): number {
    return this.spike.multiplier(now);
  }

  /** Requests per second reaching the gateway. */
  public rps(now: number): number {
    return this.config.baseRps * this.load(now);
  }

  /** Requests per second the gateway sends a service, given whether it lets them through. */
  public serviceRps(service: ServiceId, now: number, admitted: boolean): number {
    return admitted ? (this.rps(now) * this.config.weights[service]) / this.total : 0;
  }

  /** Lets `ms` pass, ending at `now`. */
  public advance(now: number, ms: number, gate: ServiceGate): void {
    const load = this.load(now);
    let inflow = 0;
    for (const service of SERVICES) {
      this.latencies[service].advance(ms, load);
      const admitted = gate.admits(service);
      if (!admitted) {
        this.failed += (this.serviceRps(service, now, true) * ms) / 1000;
      }
      inflow += this.serviceRps(service, now, admitted) * this.config.queue.publishShare;
    }
    const consumers = queueConsumers();
    const draining = consumers.filter((service) => gate.answers(service)).length;
    this.backlog.advance(ms, inflow, (this.config.queue.capacity * draining) / consumers.length);
  }

  /** A new outage begins: the fail-fast count starts again. */
  public clearFailures(): void {
    this.failed = 0;
  }

  /** Requests failed fast in the current outage. */
  public failedFast(): number {
    return Math.floor(this.failed);
  }

  public p95(service: ServiceId): number {
    return this.latencies[service].p95();
  }

  public queued(): number {
    return this.backlog.waiting();
  }

  public queueFill(): number {
    return this.backlog.fill();
  }

  /** No spike, an empty queue and every p95 back near its base. */
  public settled(now: number): boolean {
    return !this.spiking(now) && this.backlog.waiting() === 0 && SERVICES.every((service) => this.latencies[service].settled(0.05));
  }
}
