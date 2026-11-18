import type { ServiceMapCopy } from "@/content";
import { BrowserFrames, DomGhostSurface, FrameLoop, GhostDirector, GhostPresence, GhostScript, MenuClock } from "@/laptop";
import { ManualClock } from "../queue/Clock";
import { SeededRandom } from "../queue/RandomSource";
import { buildSimulation } from "./buildSimulation";
import { DotPainter } from "./DotPainter";
import { MapAnnouncer } from "./MapAnnouncer";
import { mapConfig } from "./mapConfig";
import { MapHands, MapMarks, mapGhostLoop, type MapEffect, type MapTarget } from "./mapGhost";
import { MapLayout } from "./MapLayout";
import { MapRunner } from "./MapRunner";
import { EdgeBook } from "./topology";

/** The run every visitor sees: the same seed, so the map behaves the same way for everyone. */
const SEED = 20_261_117;
/** The ghost comes back this long after the visitor's pointer leaves, as on the Front end laptop. */
const RESUME_MS = 4_000;

/** Everything the service map panel runs on. */
export type ServiceMapParts = Readonly<{
  runner: MapRunner;
  layout: MapLayout;
  painter: DotPainter;
  director: GhostDirector<MapTarget, MapEffect>;
  surface: DomGhostSurface<MapTarget>;
  announcer: MapAnnouncer;
  clock: MenuClock;
  /** The frames with everything moving: the ghost, the map and its dots. */
  motion: FrameLoop;
  /** The frames under reduced motion: the map alone, with no ghost and no dots. */
  still: FrameLoop;
}>;

/** The service map panel's composition root: builds the simulation, its painter, the ghost and their frames. */
export function composeServiceMap(copy: ServiceMapCopy): ServiceMapParts {
  const edges = new EdgeBook();
  const clock = new ManualClock();
  const simulation = buildSimulation(mapConfig(), clock, new SeededRandom(SEED), edges);
  const runner = new MapRunner(simulation, clock);
  const layout = new MapLayout(edges);
  const painter = new DotPainter(simulation, layout);
  const surface = new DomGhostSurface<MapTarget>(new MapMarks());
  const director = new GhostDirector<MapTarget, MapEffect>(
    new GhostScript(mapGhostLoop("payments")),
    new GhostPresence(RESUME_MS),
    new MapHands(runner),
    surface,
  );
  return {
    runner,
    layout,
    painter,
    director,
    surface,
    announcer: new MapAnnouncer(copy),
    clock: new MenuClock(),
    motion: new FrameLoop(new BrowserFrames(), [director, runner, painter]),
    still: new FrameLoop(new BrowserFrames(), [runner]),
  };
}
