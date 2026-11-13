import "./activity.css";

/** Class names defined in activity.css; importing them also loads the stylesheet. */
export const ACTIVITY = {
  /** A progress fill that runs and starts over. */
  fill: "orchestra-fill",
  /** A status dot breathing. */
  pulse: "orchestra-pulse",
  /** A four-glyph strip stepping like a terminal spinner. */
  spin: "orchestra-spin",
  /** A terminal cursor. */
  blink: "orchestra-blink",
  /** On an ancestor: freezes every loop inside it. */
  paused: "orchestra-paused",
} as const;
