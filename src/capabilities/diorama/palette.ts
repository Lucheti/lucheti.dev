import type { QaLight } from "../office";
import type { Part, Tone, ToonPaint } from "./kit";

/**
 * The toolkit paints by its own tone names; the office island gives them its own meaning and colours. This
 * is the one place that says which slot stands for what here.
 */
export const TONE = {
  ground: "plank",
  tile: "plankAlt",
  soil: "earth",
  bedrock: "bedrock",
  cream: "cream",
  creamShade: "trim",
  ink: "ink",
  screen: "screen",
  signal: "signal",
  deskTop: "wood",
  deskSide: "woodDark",
  rug: "rug",
  leaf: "leaf",
  leafDark: "leafDark",
  pot: "coffee",
  sunny: "sunny",
  pink: "pink",
  blue: "wallBack",
  mint: "wallLeft",
  holo: "sky",
  code: "key",
  eye: "bulb",
  canvas: "board",
  smoke: "cloud",
  lamp: "starOff",
  card: "rugEdge",
  glass: "steam",
  window: "wainscot",
  dot: "hole",
} as const satisfies Record<string, Tone>;

/** Which of the toolkit's part names each piece of the office files under. */
export const PART = {
  island: "plinth",
  ground: "floor",
  desk: "desk",
  robot: "drawers",
  prop: "shelf",
  easel: "print",
  screen: "monitor",
  rocket: "pouf",
  lamp: "lamp",
  decor: "plant",
  path: "trim",
  ticket: "pegboard",
  smoke: "steam",
  button: "control",
} as const satisfies Record<string, Part>;

/** The warm dark ink every outline is drawn in, the same as the furniture's ink. */
export const OFFICE_INK = "#2e2340";

/** A ticket card: a glowing sunny yellow. */
export const TICKET_CARD = { color: "#ffd84a", glow: "#7a4a00" } as const;

/** A ticket QA turned down, tinted while it hops back. */
export const BOUNCED_CARD = { color: "#ff7a6b", glow: "#7a1408" } as const;

/**
 * The office island's paints: a soft lilac floor over a violet and plum cake edge, cream robots with ink
 * screen faces, warm sand desks, and one colour per department (sunny Product, pink Design, blue
 * Engineering, mint QA, signal-orange Release). Signal orange is the button, the antenna tips and the
 * rocket; the ticket is a glowing sunny card.
 */
export const OFFICE_PAINTS: Readonly<Record<Tone, ToonPaint>> = {
  plank: { color: "#cbb9f4", outline: true },
  plankAlt: { color: "#e9e1ff", outline: false },
  earth: { color: "#8f6fdc", outline: true },
  bedrock: { color: "#4b3477", outline: true },
  cream: { color: "#fff6e6", outline: true },
  trim: { color: "#f1dcbf", outline: true },
  ink: { color: "#3a2d52", outline: true },
  screen: { color: "#251d38", outline: false },
  signal: { color: "#ff5a1f", outline: true },
  wood: { color: "#f6cf94", outline: true },
  woodDark: { color: "#dba46a", outline: true },
  rug: { color: "#ddd0fb", outline: false },
  leaf: { color: "#3fc17d", outline: true },
  leafDark: { color: "#27a062", outline: true },
  coffee: { color: "#ff8f6b", outline: true },
  sunny: { color: "#ffcc33", outline: true },
  pink: { color: "#ff8db0", outline: true },
  wallBack: { color: "#6db4ff", outline: true },
  wallLeft: { color: "#4fd39a", outline: true },
  sky: { color: "#9fe6ff", outline: false },
  key: { color: "#2a7fb8", outline: false },
  bulb: { color: "#b9ffe2", outline: false, glow: "#3cc995" },
  board: { color: "#fffdf6", outline: true },
  cloud: { color: "#fbf7ff", outline: true },
  starOff: { color: "#6b5d80", outline: true },
  rugEdge: { ...TICKET_CARD, outline: true },
  steam: { color: "#dff6ff", outline: false },
  wainscot: { color: "#9fe6ff", outline: false },
  hole: { color: "#3a2d52", outline: false },
};

/** QA's traffic light: each lamp's colour lit, and the glow it gives off. */
export const QA_LAMPS: Readonly<Record<Exclude<QaLight, "off">, Readonly<{ color: string; glow: string }>>> = {
  red: { color: "#ff4b3a", glow: "#c42214" },
  amber: { color: "#ffbe2e", glow: "#c77a00" },
  green: { color: "#4ee08a", glow: "#1f9e55" },
};

/** A lamp that is not lit. */
export const LAMP_OFF = "#6b5d80";

/** The lights: warm daylight, a lilac-and-peach fill so the shade is tinted, and the island's shadow on the page. */
export const OFFICE_LIGHT = {
  key: "#fff3e3",
  sky: "#e6dcff",
  ground: "#ffd9b8",
  shadow: "#3b2a63",
  halo: "#ffc93a",
} as const;
