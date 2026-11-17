import type { Laptop } from "@/content";
import { HoverTilt } from "../layers/HoverTilt";
import { BrowserFrames, BrowserTimers } from "./browser";
import { Cadence } from "./Cadence";
import { CommandPalette, type Destination } from "./CommandPalette";
import { DevicePose } from "./DevicePose";
import { DomGhostSurface } from "./DomGhostSurface";
import { GhostDirector } from "./GhostDirector";
import { GhostHands } from "./GhostHands";
import { GhostPresence } from "./GhostPresence";
import { GhostScript, type GhostStep } from "./GhostScript";
import { MenuClock } from "./MenuClock";
import { Roster } from "./Roster";
import { TaskActions } from "./TaskActions";
import { TaskBoard } from "./TaskBoard";
import { TiltDriver } from "./TiltDriver";

/** The most open tasks the list holds; arrivals wait while it is full. */
const CAPACITY = 7;
/** How long a finished task stays in its row, ticked, before it leaves the list. */
const LINGER_MS = 1100;
/** How many results the palette lists at once, and how many of them may be tasks. */
const PALETTE_LIMITS = { tasks: 3, total: 5 } as const;
/** A new task arrives this often while the panel is on screen, the first one sooner. */
const ARRIVAL_EVERY_MS = 17_000;
const FIRST_ARRIVAL_MS = 9_000;
/** The ghost comes back this long after the visitor's pointer leaves. */
const RESUME_MS = 4_000;
/** The product-shot pose, seen from a little left and above, and how far the pointer may lean it. */
const REST_POSE = { x: 3, y: 9 } as const;
const LEAN_DEGREES = 2.5;
/** How quickly the lean follows the pointer, per second. */
const LEAN_RATE = 3.5;

/** The ghost's loop: hover a task, finish it, search for something, look at "My tasks", and come back. */
function ghostLoop(query: string): readonly GhostStep[] {
  return [
    { kind: "wait", ms: 1200 },
    { kind: "move", to: { kind: "row", slot: 0 }, ms: 1400 },
    { kind: "wait", ms: 1500 },
    { kind: "move", to: { kind: "status", slot: 0 }, ms: 700 },
    { kind: "wait", ms: 250 },
    { kind: "click", effect: { kind: "complete", slot: 0 }, ms: 400 },
    { kind: "wait", ms: 1500 },
    { kind: "move", to: { kind: "search" }, ms: 1500 },
    { kind: "wait", ms: 300 },
    { kind: "click", effect: { kind: "open-palette" }, ms: 400 },
    { kind: "wait", ms: 600 },
    { kind: "type", text: query, msPerKey: 190 },
    { kind: "wait", ms: 1800 },
    { kind: "key", effect: { kind: "close-palette" }, ms: 500 },
    { kind: "move", to: { kind: "view", view: { kind: "mine" } }, ms: 1300 },
    { kind: "wait", ms: 200 },
    { kind: "click", effect: { kind: "select", view: { kind: "mine" } }, ms: 400 },
    { kind: "wait", ms: 2400 },
    { kind: "move", to: { kind: "view", view: { kind: "all" } }, ms: 900 },
    { kind: "wait", ms: 200 },
    { kind: "click", effect: { kind: "select", view: { kind: "all" } }, ms: 400 },
    { kind: "wait", ms: 700 },
    { kind: "move", to: { kind: "rest" }, ms: 1600 },
    { kind: "wait", ms: 2400 },
  ];
}

/** Everything the laptop panel runs on. */
export type LaptopParts = Readonly<{
  board: TaskBoard;
  palette: CommandPalette;
  actions: TaskActions;
  director: GhostDirector;
  surface: DomGhostSurface;
  tilt: TiltDriver;
  pose: DevicePose;
  clock: MenuClock;
  roster: Roster;
}>;

/** The laptop panel's composition root: builds the task board, the palette, the ghost and the tilt. */
export function composeLaptop(content: Laptop): LaptopParts {
  const board = new TaskBoard({ tasks: content.tasks, incoming: content.incoming, me: content.me, capacity: CAPACITY });
  const destinations: readonly Destination[] = [
    { name: content.views.mine, view: { kind: "mine" } },
    { name: content.views.all, view: { kind: "all" } },
    { name: content.views.done, view: { kind: "done" } },
    ...content.projects.map((project): Destination => ({ name: project.name, view: { kind: "project", project: project.id } })),
  ];
  const palette = new CommandPalette(board, destinations, PALETTE_LIMITS);
  const actions = new TaskActions(board, new BrowserTimers(), LINGER_MS);
  const surface = new DomGhostSurface();
  const frames = new BrowserFrames();
  const director = new GhostDirector(
    new GhostScript(ghostLoop(content.search.sample)),
    new GhostPresence(RESUME_MS),
    new GhostHands(board, palette, actions),
    new Cadence(ARRIVAL_EVERY_MS, FIRST_ARRIVAL_MS),
    board,
    palette,
    surface,
    frames,
  );
  const pose = new DevicePose(new HoverTilt(LEAN_RATE), REST_POSE, LEAN_DEGREES);
  return {
    board,
    palette,
    actions,
    director,
    surface,
    tilt: new TiltDriver(pose, frames),
    pose,
    clock: new MenuClock(),
    roster: new Roster(content),
  };
}
