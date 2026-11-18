/**
 * The app-window kit the Front end and Back end panels share: the stage that scales a window to its column
 * and crops it to a corner, the window's chrome, the shared look of the apps, and the ghost cursor that plays
 * a loop of real actions while nobody is touching the panel.
 */
export { AppStage, WINDOW_HEIGHT, type GhostSeat, type ScreenBindings } from "./AppStage";
export { AppWindowChrome, SidebarShell, Toolbar } from "./AppWindowChrome";
export { assertNever } from "./assertNever";
export { BrowserFrames, BrowserTimers, MAX_FRAME_MS, type FrameScheduler, type Timers } from "./browser";
export { Cadence } from "./Cadence";
export type { Corner } from "./corner";
export { DomGhostSurface, type GhostMarks, type Size } from "./DomGhostSurface";
export { FrameLoop, type FrameListener } from "./FrameLoop";
export { GhostDirector, type GhostHands, type GhostSurface } from "./GhostDirector";
export { GhostPresence } from "./GhostPresence";
export { GhostScript, PRESS_MS, type GhostFrame, type GhostStep, type Locator, type Point } from "./GhostScript";
export { ArrowPointer, ChevronDownGlyph, ChevronRightGlyph, LINE, SearchGlyph, type GlyphProps } from "./glyphs";
export { COUNT_PILL, INK, PRESSABLE, TAG_PILL, WORD_PILL } from "./tokens";
