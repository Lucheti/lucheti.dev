import type { Part, Tone, ToonPaint } from "./kit";
import type { LampColour } from "./ServiceLook";

/**
 * The toolkit paints by its own tone names; the queue island gives them its own meaning and colours. This
 * is the one place that says which slot stands for what here.
 */
export const TONE = {
  ground: "plank",
  paving: "plankAlt",
  soil: "earth",
  bedrock: "bedrock",
  cream: "cream",
  creamShade: "trim",
  ink: "ink",
  screen: "screen",
  signal: "signal",
  glass: "sky",
  bush: "leaf",
  bushDark: "leafDark",
  sunny: "sunny",
  pink: "pink",
  window: "wallBack",
  smoke: "cloud",
  lamp: "bulb",
  bead: "key",
  belt: "woodDark",
} as const satisfies Record<string, Tone>;

/** Which of the toolkit's part names each piece of the queue island files under. */
export const PART = {
  island: "plinth",
  ground: "floor",
  kiosk: "shelf",
  button: "control",
  belt: "desk",
  broker: "monitor",
  machine: "drawers",
  decor: "plant",
  track: "trim",
  parcel: "pouf",
  smoke: "steam",
} as const satisfies Record<string, Part>;

/** The warm dark ink every outline is drawn in, the same as the machines' ink. */
export const QUEUE_INK = "#2b2236";

const ink: ToonPaint = { color: "#3a2f48", outline: true };

/**
 * The queue island's paints: a fresh mint ground over a teal cake edge, cream-and-ink machines, signal
 * orange for the button and the messages, and a little sunny yellow and pink. Unused slots get cream.
 */
export const QUEUE_PAINTS: Readonly<Record<Tone, ToonPaint>> = {
  plank: { color: "#8fe0c0", outline: true },
  plankAlt: { color: "#c9f2dc", outline: true },
  earth: { color: "#23a08f", outline: true },
  bedrock: { color: "#1c5a5e", outline: true },
  cream: { color: "#fff4e0", outline: true },
  trim: { color: "#f2dfc0", outline: true },
  ink,
  screen: { color: "#22303a", outline: false },
  signal: { color: "#ff5a1f", outline: true },
  sky: { color: "#e8fbff", outline: false },
  leaf: { color: "#2bb582", outline: true },
  leafDark: { color: "#1b9168", outline: true },
  sunny: { color: "#ffcc33", outline: true },
  pink: { color: "#ff8db0", outline: true },
  wallBack: { color: "#9fdcff", outline: false },
  cloud: { color: "#f4f1ee", outline: true },
  bulb: { color: "#ffffff", outline: true, glow: "#000000" },
  key: { color: "#3a2f48", outline: false },
  woodDark: { color: "#4a3d58", outline: true },
  wallLeft: { color: "#fff4e0", outline: true },
  wainscot: { color: "#fff4e0", outline: true },
  rug: { color: "#fff4e0", outline: true },
  rugEdge: { color: "#fff4e0", outline: true },
  wood: { color: "#fff4e0", outline: true },
  steam: { color: "#ffffff", outline: false },
  board: { color: "#fff4e0", outline: true },
  hole: { color: "#fff4e0", outline: false },
  coffee: { color: "#fff4e0", outline: false },
  starOff: { color: "#fff4e0", outline: true },
};

/** The status lamp's colours, and the glow each gives off when lit. */
export const LAMP: Readonly<Record<LampColour, Readonly<{ color: string; glow: string }>>> = {
  green: { color: "#4ee08a", glow: "#1f9e55" },
  amber: { color: "#ffbe2e", glow: "#c77a00" },
  red: { color: "#ff4b3a", glow: "#b51d10" },
};

/** An unlit lamp, between blinks. */
export const LAMP_OFF = "#9a8fa6";

/** The lights: warm daylight, a mint-and-sky fill so the shade is tinted, and the island's shadow on the page. */
export const QUEUE_LIGHT = {
  key: "#fff3e0",
  sky: "#d6f3ff",
  ground: "#b8f0d4",
  shadow: "#1d4a4f",
} as const;
