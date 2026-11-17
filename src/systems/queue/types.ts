/** Where a message can be: at the producer, in the queue, or at one of the services (by index). */
export type Anchor =
  | Readonly<{ kind: "producer" }>
  | Readonly<{ kind: "queue" }>
  | Readonly<{ kind: "service"; index: number }>;

/** A consumer service's health; `since` is the simulation time the status began, in ms. */
export type ServiceStatus =
  | Readonly<{ kind: "healthy" }>
  | Readonly<{ kind: "busy"; since: number }>
  | Readonly<{ kind: "down"; since: number }>
  | Readonly<{ kind: "restarting"; since: number }>;

/** The four names a service status can take. */
export type ServiceStatusKind = ServiceStatus["kind"];

/** A message travelling between two anchors, `progress` from 0 (left) to 1 (arrived). */
export type FlightView = Readonly<{ id: number; from: Anchor; to: Anchor; progress: number }>;

/** One consumer service as the view draws it. */
export type ServiceView = Readonly<{
  status: ServiceStatus;
  /** Messages at the service: the ones being worked on and the ones waiting their turn. */
  held: number;
  /** Messages dealt to the service and still on their way. */
  incoming: number;
  processed: number;
  restarts: number;
}>;

/** Everything the view needs from one instant of the simulation. */
export type QueueSnapshot = Readonly<{
  time: number;
  /** Bumps whenever anything but flight progress changes, so the view re-renders only then. */
  revision: number;
  /** The ids waiting in the queue, head (next to be dealt) first. */
  queued: readonly number[];
  flights: readonly FlightView[];
  services: readonly ServiceView[];
  totals: Readonly<{ produced: number; processed: number; restarts: number }>;
}>;

/** Something worth telling the visitor about. */
export type QueueEvent =
  | Readonly<{ kind: "down"; service: number; returned: number }>
  | Readonly<{ kind: "restarting"; service: number }>
  | Readonly<{ kind: "recovered"; service: number }>
  | Readonly<{ kind: "settled" }>;

/** How one consumer service behaves. */
export type ServiceProfile = Readonly<{
  /** Mean time one worker takes on one message, in ms. */
  workMs: number;
}>;

/** The rules every consumer service follows. */
export type ServiceRules = Readonly<{
  /** Messages a service works on at once. */
  workers: number;
  /** Work time varies by up to this fraction either way. */
  workJitter: number;
  /** In-flight messages a service handles comfortably; above it the service is busy. */
  limit: number;
  /** How long a service can stay over its limit before it goes down, in ms. */
  overloadMs: number;
  /** How long a service stays down before it starts restarting, in ms. */
  downMs: number;
  /** How long a restart takes, in ms. */
  restartMs: number;
}>;

/** Every number that shapes the simulation. */
export type QueueConfig = Readonly<{
  /** The steady flow: the mean gap between messages and how far a gap varies either way, as a fraction. */
  arrival: Readonly<{ meanGapMs: number; jitter: number }>;
  /** Sent messages leave the producer this far apart, and no more than `maxOutstanding` are ever unfinished. */
  burst: Readonly<{ gapMs: number; maxOutstanding: number }>;
  /** Flight times, in ms. */
  travel: Readonly<{ toQueue: number; toService: number; back: number }>;
  /** A message rests in the queue at least `dwellMs`; the broker deals one at most every `dealGapMs`. */
  broker: Readonly<{ dwellMs: number; dealGapMs: number; capacity: number }>;
  rules: ServiceRules;
  services: readonly ServiceProfile[];
  /** The fixed simulation step, in ms. */
  stepMs: number;
}>;
