import type { Clock } from "../queue/Clock";
import type { RandomSource } from "../queue/RandomSource";
import { CircuitBreaker } from "./CircuitBreaker";
import { Emitter } from "./Emitter";
import { FlightPool } from "./FlightPool";
import { Latency } from "./Latency";
import type { MapConfig } from "./mapConfig";
import { QueueBacklog } from "./QueueBacklog";
import { ServiceBag } from "./ServiceBag";
import { ServiceHealth } from "./ServiceHealth";
import { ServiceMapSimulation } from "./ServiceMapSimulation";
import { Spike } from "./Spike";
import type { EdgeBook, ServiceId } from "./topology";
import { TrafficModel } from "./TrafficModel";

/** One value per service, made by `make`. */
function perService<T>(make: (service: ServiceId) => T): Readonly<Record<ServiceId, T>> {
  return { orders: make("orders"), payments: make("payments"), inventory: make("inventory") };
}

/**
 * Builds the service map simulation on a clock and a source of randomness. Its dots fly on `edges`, which the
 * layout that draws them must share.
 */
export function buildSimulation(config: MapConfig, clock: Clock, random: RandomSource, edges: EdgeBook): ServiceMapSimulation {
  const latencies = perService((service) => new Latency(config.latency.base[service], config.latency.sensitivity, config.latency.settleMs));
  return new ServiceMapSimulation({
    config,
    clock,
    random,
    edges,
    health: perService(() => new ServiceHealth(config.downMs)),
    breakers: perService(() => new CircuitBreaker(config.breaker)),
    traffic: new TrafficModel(config, new Spike(config.spike), latencies, new QueueBacklog(config.queue.full)),
    pool: new FlightPool(config.pool.size, config.pool.reserve),
    bag: new ServiceBag(config.weights, random),
    requests: new Emitter(random, config.jitter),
    drains: new Emitter(random, config.jitter),
  });
}
