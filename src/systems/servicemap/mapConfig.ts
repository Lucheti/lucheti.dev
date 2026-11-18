import type { BreakerPolicy } from "./CircuitBreaker";
import type { SpikeShape } from "./Spike";
import type { ServiceId } from "./topology";

/** How the service map runs. Rates are per second, times in ms. */
export type MapConfig = Readonly<{
  /** The steady traffic at the gateway, in requests per second, and each service's share of it. */
  baseRps: number;
  weights: Readonly<Record<ServiceId, number>>;
  /** How many request dots leave the clients each second in steady traffic, varied by up to `jitter` either way. */
  dotsPerSecond: number;
  jitter: number;
  /** How long a dot takes over one edge: a request, a retry, a test request and a drained message. */
  hops: Readonly<{ request: number; retry: number; probe: number; drain: number }>;
  /** Tries per request, the first included, before the gateway gives up on it. */
  maxAttempts: number;
  /** The most dots in the air, and the slots kept free for retries and test requests. */
  pool: Readonly<{ size: number; reserve: number }>;
  breaker: BreakerPolicy;
  /** How often a half-open breaker sends a test request. */
  probeEveryMs: number;
  /** How long a downed service stays down before it restarts. */
  downMs: number;
  spike: SpikeShape;
  /** The queue: the depth that fills its bar, the share of requests that publish a message, what the consumers drain. */
  queue: Readonly<{ full: number; publishShare: number; capacity: number; drainDotsPerSecond: number }>;
  /** Each service's p95 at steady traffic, how much load lifts it, and how quickly it follows. */
  latency: Readonly<{ base: Readonly<Record<ServiceId, number>>; sensitivity: number; settleMs: number }>;
  /** Operations per second a store sees for each request per second of the service in front of it. */
  storeOps: Readonly<{ postgres: number; redis: number }>;
  /** How often the cards' figures refresh. */
  metricEveryMs: number;
}>;

/** The service map's tuning: calm in steady traffic, readable in a spike. */
export function mapConfig(): MapConfig {
  return {
    baseRps: 180,
    weights: { orders: 3, payments: 2, inventory: 3 },
    dotsPerSecond: 2.1,
    jitter: 0.35,
    hops: { request: 950, retry: 650, probe: 900, drain: 1000 },
    maxAttempts: 3,
    pool: { size: 28, reserve: 4 },
    breaker: { threshold: 3, openMs: 3000, probesToClose: 2 },
    probeEveryMs: 700,
    downMs: 5000,
    spike: { peak: 4.3, riseMs: 1000, holdMs: 5000, fallMs: 2000 },
    queue: { full: 1000, publishShare: 0.5, capacity: 260, drainDotsPerSecond: 2.5 },
    latency: { base: { orders: 42, payments: 58, inventory: 36 }, sensitivity: 0.85, settleMs: 1200 },
    storeOps: { postgres: 2, redis: 3 },
    metricEveryMs: 500,
  };
}
