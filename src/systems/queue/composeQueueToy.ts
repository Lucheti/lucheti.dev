import { ManualClock } from "./Clock";
import { FlightPainter } from "./FlightPainter";
import { QueueAnnouncer, type AnnouncementTemplates } from "./QueueAnnouncer";
import { BrowserFrames, QueueLoop } from "./QueueLoop";
import { QueueSimulation } from "./QueueSimulation";
import { SeededRandom } from "./RandomSource";
import { QUEUE_CONFIG } from "./queueConfig";

/** The seed every visitor starts from, so the server and the browser draw the same first frame. */
const SEED = 20261117;

/**
 * The toy has already run this long when it is first drawn, so it looks lived-in before anyone looks
 * (and under reduced motion, where this frame is all there is): with this seed it lands on one message
 * waiting in the queue and two services each at work on one.
 */
const WARM_UP_MS = 9800;

/** Messages in the air drawn at once; the rest of a flood is drawn in the queue as "+N". */
const FLYING_DOTS = 16;

/**
 * The toy plays at 40% of the simulation's real-time tuning, so a visitor can follow each message,
 * see a service struggle, fall over and come back. Every timing stretches evenly, so the behaviour
 * (what one, two or three sends do) is unchanged, only slower.
 */
const PLAYBACK_SPEED = 0.4;

/** Everything the queue panel runs on. */
export type QueueToy = Readonly<{
  loop: QueueLoop;
  painter: FlightPainter;
  announcer: QueueAnnouncer;
  /** A service is busy above `limit` messages and is dealt at most `capacity`. */
  slots: Readonly<{ limit: number; capacity: number }>;
  /** How long a busy service holds out, in real ms at playback speed, for the fuse drawn under it. */
  overloadMs: number;
}>;

/** The panel's composition root: builds the simulation, its clock, the painter and the loop. */
export function composeQueueToy(serviceNames: readonly string[], templates: AnnouncementTemplates): QueueToy {
  if (serviceNames.length !== QUEUE_CONFIG.services.length) {
    throw new Error(`The queue is tuned for ${QUEUE_CONFIG.services.length} services, got ${serviceNames.length}`);
  }
  const clock = new ManualClock();
  const simulation = new QueueSimulation(clock, new SeededRandom(SEED), QUEUE_CONFIG);
  clock.advance(WARM_UP_MS);
  simulation.update();
  simulation.takeEvents();

  const painter = new FlightPainter(FLYING_DOTS);
  return {
    loop: new QueueLoop(simulation, clock, new BrowserFrames(), painter, PLAYBACK_SPEED),
    painter,
    announcer: new QueueAnnouncer(templates, serviceNames),
    slots: { limit: QUEUE_CONFIG.rules.limit, capacity: QUEUE_CONFIG.broker.capacity },
    overloadMs: QUEUE_CONFIG.rules.overloadMs / PLAYBACK_SPEED,
  };
}
